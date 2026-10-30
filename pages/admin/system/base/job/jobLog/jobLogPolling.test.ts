import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Admin } from '@features/fa-admin-pages/types';
import { appendVisibleLog, MAX_VISIBLE_LOG_CHARS, startJobLogPolling } from './jobLogPolling';

const chunk = (overrides: Partial<Admin.JobLogRead> = {}): Admin.JobLogRead => ({
  content: '日志', nextOffset: '6', status: 1, hasMore: false, available: true, ...overrides,
});

describe('任务日志轮询', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each([2, 9] as const)('终态 %s 会补齐剩余日志后停止', async (status) => {
    const read = vi.fn().mockResolvedValueOnce(chunk({ status, hasMore: true }))
      .mockResolvedValueOnce(chunk({ status, nextOffset: '12' }));
    const onChunk = vi.fn();
    const stop = startJobLogPolling({ read, onChunk, onError: vi.fn() });
    await vi.advanceTimersByTimeAsync(10000);
    expect(read).toHaveBeenCalledTimes(2);
    expect(read.mock.calls.map(([offset]) => offset)).toEqual(['0', '6']);
    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
    stop();
  });

  it('执行中没有新日志仍每两秒查询', async () => {
    const read = vi.fn().mockResolvedValue(chunk({ content: '', nextOffset: '0' }));
    const stop = startJobLogPolling({ read, onChunk: vi.fn(), onError: vi.fn() });
    await vi.advanceTimersByTimeAsync(4000);
    expect(read).toHaveBeenCalledTimes(3);
    stop();
    await vi.advanceTimersByTimeAsync(10000);
    expect(read).toHaveBeenCalledTimes(3);
  });

  it('等待中的请求不会重叠，关闭后取消请求并忽略迟到响应', async () => {
    let resolve!: (value: Admin.JobLogRead) => void;
    const read = vi.fn().mockReturnValue(new Promise<Admin.JobLogRead>((done) => { resolve = done; }));
    const onChunk = vi.fn();
    const onError = vi.fn();
    const stop = startJobLogPolling({ read, onChunk, onError });
    await vi.advanceTimersByTimeAsync(10000);
    expect(read).toHaveBeenCalledTimes(1);
    stop();
    expect(read.mock.calls[0][1].aborted).toBe(true);
    resolve(chunk());
    await vi.advanceTimersByTimeAsync(0);
    expect(onChunk).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('文件不可用或网络错误时停止，错误不会无限重试', async () => {
    const read = vi.fn().mockResolvedValue(chunk({ available: false }));
    startJobLogPolling({ read, onChunk: vi.fn(), onError: vi.fn() });
    await vi.advanceTimersByTimeAsync(10000);
    expect(read).toHaveBeenCalledTimes(1);
    const onError = vi.fn();
    const failed = vi.fn().mockRejectedValue(new Error('网络失败'));
    startJobLogPolling({ read: failed, onChunk: vi.fn(), onError });
    await vi.advanceTimersByTimeAsync(10000);
    expect(failed).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('未推进的游标不会导致立即重试空转', async () => {
    const read = vi.fn().mockResolvedValue(chunk({ content: '', nextOffset: '0', hasMore: true }));
    const stop = startJobLogPolling({ read, onChunk: vi.fn(), onError: vi.fn() });
    await vi.advanceTimersByTimeAsync(1999);
    expect(read).toHaveBeenCalledTimes(1);
    stop();
  });

  it('限制显示缓冲且不拆分 emoji', () => {
    const previous = '😀' + 'x'.repeat(MAX_VISIBLE_LOG_CHARS - 2);
    const result = appendVisibleLog(previous, '结尾');
    expect(result.trimmed).toBe(true);
    expect(result.content.length).toBeLessThanOrEqual(MAX_VISIBLE_LOG_CHARS);
    expect(result.content.endsWith('结尾')).toBe(true);
    const splitPair = appendVisibleLog('😀' + 'x'.repeat(MAX_VISIBLE_LOG_CHARS - 2), 'x');
    expect(splitPair.content.charCodeAt(0)).not.toBe(0xde00);
  });
});
