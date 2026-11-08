import { afterEach, expect, it, vi } from 'vitest';
import type { Admin } from '@/types';
import { startFlowRunPolling } from './flowRunPolling';
const result = (status: number) => ({ log: { id: 1, status }, nodes: [] }) as unknown as Admin.JobFlowRun;
afterEach(() => vi.useRealTimers());
it('does not overlap pending requests and stops at unconfirmed', async () => {
  vi.useFakeTimers();
  let resolve!: (value: Admin.JobFlowRun) => void;
  const read = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Admin.JobFlowRun>((done) => {
          resolve = done;
        }),
    )
    .mockResolvedValue(result(8));
  const stop = startFlowRunPolling({ read, onResult: vi.fn(), onError: vi.fn() });
  await vi.advanceTimersByTimeAsync(10000);
  expect(read).toHaveBeenCalledTimes(1);
  resolve(result(1));
  await vi.advanceTimersByTimeAsync(2000);
  expect(read).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(10000);
  expect(read).toHaveBeenCalledTimes(2);
  stop();
});
it.each([2, 9])('does not poll after terminal %s', async (status) => {
  vi.useFakeTimers();
  const read = vi.fn().mockResolvedValue(result(status));
  const stop = startFlowRunPolling({ read, onResult: vi.fn(), onError: vi.fn() });
  await vi.advanceTimersByTimeAsync(10000);
  expect(read).toHaveBeenCalledTimes(1);
  stop();
});
it('closing aborts reads and suppresses late responses', async () => {
  let resolve!: (value: Admin.JobFlowRun) => void;
  const read = vi.fn(
    (_signal: AbortSignal) =>
      new Promise<Admin.JobFlowRun>((done) => {
        resolve = done;
      }),
  );
  const onResult = vi.fn();
  const stop = startFlowRunPolling({ read, onResult, onError: vi.fn() });
  const signal = read.mock.calls[0]?.[0] as unknown as AbortSignal;
  stop();
  resolve(result(1));
  await Promise.resolve();
  expect(onResult).not.toHaveBeenCalled();
  // The actual read receives the cancelled signal.
  expect(signal.aborted).toBe(true);
});
it('request failures stop polling', async () => {
  vi.useFakeTimers();
  const read = vi.fn().mockRejectedValue(new Error('failed'));
  const onError = vi.fn();
  const stop = startFlowRunPolling({ read, onResult: vi.fn(), onError });
  await vi.advanceTimersByTimeAsync(10000);
  expect(read).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledTimes(1);
  stop();
});
