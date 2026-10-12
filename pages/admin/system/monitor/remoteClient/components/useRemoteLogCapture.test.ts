import { act, createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useRemoteLogCapture from './useRemoteLogCapture';
import { renderer } from './__tests__/renderer';

const wire = vi.hoisted(() => ({ state: { readyState: 1 }, listeners: new Map<string, Set<(event: { payload: any }) => void>>(), send: vi.fn() }));
vi.mock('@features/fa-admin-pages/layout/websocket', () => ({
  sendMessage: wire.send,
  useWsStore: Object.assign((selector: (state: typeof wire.state) => any) => selector(wire.state), { getState: () => wire.state }),
}));
vi.mock('use-bus', async () => {
  const { useEffect } = await import('react');
  return {
    default: (types: string[], callback: (event: { payload: any }) => void) => {
      useEffect(() => {
        for (const type of types) {
          if (!wire.listeners.has(type)) wire.listeners.set(type, new Set());
          wire.listeners.get(type)?.add(callback);
        }
        return () => {
          for (const type of types) wire.listeners.get(type)?.delete(callback);
        };
      });
    },
  };
});

let capture: ReturnType<typeof useRemoteLogCapture>;
let root: any;
const entry = vi.fn();
const marker = vi.fn();
const client = { id: 'original', userId: 'user-1', clientInstanceId: 'installation-1' } as Parameters<typeof useRemoteLogCapture>[0];
function Harness() {
  capture = useRemoteLogCapture(client, entry, marker);
  return null;
}
function render() {
  act(() => renderer.updateContainer(createElement(Harness), root, null, () => {}));
}
function emit(type: string, payload: any) {
  act(() => {
    for (const listener of Array.from(wire.listeners.get(`@@ws/RECEIVE/${type}`) || [])) listener({ payload });
  });
}
function watchId() {
  return wire.send.mock.calls.find(([message]) => message.type === 'RemoteClientStatus' && message.data.action === 'watch')?.[0].data.watchId;
}
function status(state = 'online', clientId = 'original') {
  emit('RemoteClientStatus', {
    action: 'status',
    watchId: watchId(),
    state,
    clientId: state === 'offline' ? undefined : clientId,
    lastSeenAt: Date.now(),
    serverTime: Date.now(),
  });
}
function requests() {
  return wire.send.mock.calls.map(([message]) => message).filter((message) => message.type === 'RemoteLog' && message.data.action === 'start');
}
function confirm(request = requests().at(-1), sessionId = 'capture-1') {
  emit('RemoteLog', { ...request.data, sessionId, expiresAt: Date.now() + 60_000, serverTime: Date.now(), action: 'started' });
}

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-12T00:00:00Z'));
  wire.state.readyState = 1;
  wire.listeners.clear();
  wire.send.mockClear();
  entry.mockClear();
  marker.mockClear();
  root = renderer.createContainer({}, 0, null, false, null, '', () => {}, null);
  render();
});
afterEach(() => {
  act(() => renderer.updateContainer(null, root, null, () => {}));
  vi.useRealTimers();
});

describe('远程日志采集恢复', () => {
  it('开启回执前不显示采集中，停止后忽略迟到回执和日志', () => {
    status();
    act(() => capture.startCapture());
    const request = requests()[0];
    emit('RemoteLog', { ...request.data, action: 'starting', sessionId: 'capture-1' });
    expect(capture.phase).toBe('starting');
    confirm(request);
    expect(capture.phase).toBe('active');
    act(() => capture.stopCapture());
    confirm(request);
    emit('RemoteLog', { action: 'entry', requestId: request.data.requestId, sessionId: 'capture-1', message: 'late log' });
    expect(capture.wanted).toBe(false);
    expect(capture.phase).toBe('idle');
    expect(entry).not.toHaveBeenCalled();
  });
  it('跟踪同一安装实例的新连接，保留原截止时间并隔离旧会话', () => {
    status();
    act(() => capture.startCapture());
    const first = requests()[0];
    confirm(first);
    const deadline = Date.now() + 60_000;
    status('offline');
    expect(capture.wanted).toBe(true);
    expect(capture.phase).toBe('waiting');
    status('online', 'reconnected');
    act(() => vi.advanceTimersByTime(1100));
    const second = requests().at(-1);
    expect(second.data.clientId).toBe('reconnected');
    expect(second.data.expiresAt).toBe(deadline);
    expect(second.data.requestId).not.toBe(first.data.requestId);
    confirm(second, 'capture-2');
    emit('RemoteLog', { action: 'entry', clientId: 'original', requestId: first.data.requestId, sessionId: 'capture-1', message: 'old' });
    emit('RemoteLog', { action: 'entry', clientId: 'reconnected', requestId: second.data.requestId, sessionId: 'capture-2', message: 'new' });
    expect(entry).toHaveBeenCalledTimes(1);
    expect(entry.mock.calls[0][0].message).toBe('new');
    expect(capture.phase).toBe('active');
  });
  it('管理端重连后先重新订阅，拿到新快照才恢复采集', () => {
    status();
    act(() => capture.startCapture());
    confirm();
    wire.state.readyState = 3;
    render();
    expect(capture.state).toBe('unknown');
    expect(capture.wanted).toBe(true);
    wire.state.readyState = 1;
    render();
    act(() => vi.advanceTimersByTime(1100));
    expect(requests()).toHaveLength(1);
    status();
    expect(requests()).toHaveLength(2);
  });
  it('断线时主动停止后不会自动恢复', () => {
    status();
    act(() => capture.startCapture());
    confirm();
    status('offline');
    act(() => capture.stopCapture());
    status('online', 'reconnected');
    act(() => vi.advanceTimersByTime(2000));
    expect(requests()).toHaveLength(1);
    expect(capture.wanted).toBe(false);
  });
  it('离线等待也受原采集期限约束', () => {
    status();
    act(() => capture.startCapture());
    confirm();
    status('offline');
    act(() => vi.advanceTimersByTime(61_000));
    expect(capture.wanted).toBe(false);
    status('online', 'reconnected');
    expect(requests()).toHaveLength(1);
    expect(capture.notice).toContain('超时');
  });
  it('页面关闭时取消订阅并停止采集', () => {
    status();
    act(() => capture.startCapture());
    confirm();
    act(() => renderer.updateContainer(null, root, null, () => {}));
    const messages = wire.send.mock.calls.map(([message]) => message);
    expect(messages.some((message) => message.data.action === 'unwatch')).toBe(true);
    expect(messages.some((message) => message.data.action === 'stop')).toBe(true);
  });
});
