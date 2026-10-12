import { describe, expect, it } from 'vitest';
import { canResumeCapture, getConnectionState } from './connectionStatus';

describe('客户端状态判定', () => {
  it('按真实心跳时间判定延迟和离线', () => {
    const snapshot = { state: 'online' as const, clientId: 'a', lastSeenAt: 1000, receivedAt: 65_000 };
    expect(getConnectionState(snapshot, true, 41_000)).toBe('online');
    expect(getConnectionState(snapshot, true, 42_000)).toBe('delayed');
    expect(getConnectionState(snapshot, true, 62_000)).toBe('offline');
  });
  it('管理端断线或快照停止更新时显示未知，而非断言 App 离线', () => {
    const snapshot = { state: 'online' as const, clientId: 'a', lastSeenAt: 1000, receivedAt: 1000 };
    expect(getConnectionState(snapshot, false, 2000)).toBe('unknown');
    expect(getConnectionState(snapshot, true, 17_000)).toBe('unknown');
  });
  it('手动停止、状态未知和原采集期限结束均禁止自动恢复', () => {
    expect(canResumeCapture(true, 'online', 'new', 20_000, 10_000)).toBe(true);
    expect(canResumeCapture(false, 'online', 'new', 20_000, 10_000)).toBe(false);
    expect(canResumeCapture(true, 'unknown', 'new', 20_000, 10_000)).toBe(false);
    expect(canResumeCapture(true, 'online', 'new', 20_000, 20_000)).toBe(false);
  });
});
