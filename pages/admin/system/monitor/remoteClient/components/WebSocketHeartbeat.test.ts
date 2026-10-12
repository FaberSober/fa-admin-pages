import { act, createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WebSocketLayout from '@features/fa-admin-pages/layout/websocket/WebSocketLayout';
import { renderer } from './__tests__/renderer';

const wire = vi.hoisted(() => ({
  readyState: 1,
  latestMessage: undefined as { data: string } | undefined,
  tick: () => {},
  send: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  setHandlers: vi.fn(),
}));
vi.mock('ahooks', () => ({
  useWebSocket: () => ({
    readyState: wire.readyState,
    latestMessage: wire.latestMessage,
    sendMessage: wire.send,
    connect: wire.connect,
    disconnect: wire.disconnect,
  }),
  useInterval: (callback: () => void) => {
    wire.tick = callback;
  },
}));
vi.mock('@fa/ui', () => ({
  FaUtils: { tryParseJson: (value: string) => JSON.parse(value) },
  getClientInstanceId: () => 'browser-instance',
  getToken: () => 'test-token',
}));
vi.mock('use-bus', () => ({ dispatch: vi.fn() }));
vi.mock('@features/fa-admin-pages/layout/websocket/stores/useWsStore', () => ({
  useWsStore: Object.assign((selector: any) => selector({ setHandlers: wire.setHandlers }), { setState: vi.fn() }),
}));

let root: any;
function render() {
  act(() => renderer.updateContainer(createElement(WebSocketLayout), root, null, () => {}));
}
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-12T00:00:00Z'));
  vi.stubGlobal('window', { location: { protocol: 'https:', host: 'test' } });
  vi.stubGlobal('document', { title: 'Test' });
  vi.stubGlobal('navigator', { platform: 'Test' });
  wire.readyState = 1;
  wire.latestMessage = undefined;
  vi.clearAllMocks();
  root = renderer.createContainer({}, 0, null, false, null, '', () => {}, null);
  render();
  wire.connect.mockClear();
});
afterEach(() => {
  act(() => renderer.updateContainer(null, root, null, () => {}));
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('管理端半开连接恢复', () => {
  it('发送心跳失败时主动关闭连接', () => {
    wire.send.mockImplementationOnce(() => { throw new Error('send failed'); });
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    act(() => wire.tick());
    expect(wire.disconnect).toHaveBeenCalledOnce();
    output.mockRestore();
  });
  it('业务消息不能代替 ping 回执，超时后断开并重连', () => {
    act(() => wire.tick());
    wire.latestMessage = { data: JSON.stringify({ type: 'DATE', code: 0, data: 'server push' }) };
    render();
    vi.advanceTimersByTime(20_000);
    act(() => wire.tick());
    expect(wire.disconnect).toHaveBeenCalledOnce();
    wire.readyState = 3;
    render();
    act(() => wire.tick());
    expect(wire.connect).toHaveBeenCalledOnce();
  });
  it('收到 ping 回执后继续发送下一次心跳', () => {
    act(() => wire.tick());
    wire.latestMessage = { data: JSON.stringify({ type: null, code: 0 }) };
    render();
    vi.advanceTimersByTime(20_000);
    act(() => wire.tick());
    expect(wire.disconnect).not.toHaveBeenCalled();
    expect(wire.send.mock.calls.filter(([message]) => message === 'ping')).toHaveLength(2);
  });
});
