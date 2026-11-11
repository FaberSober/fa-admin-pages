import { expect, it, vi } from 'vitest';
import { loadTimelineSnapshot } from './timelineRefresh';
import type { TimelineResult } from './timeline';

const empty: TimelineResult = { serverTime: '2026-11-11T12:00:00', entries: [], buckets: [], stats: { total: 0, success: 0, failed: 0, finished: 0, avgDurationMs: null, maxDurationMs: null } };

it('有聚合时等待当前窗口完成后才返回完整快照', async () => {
  const day = { ...empty, buckets: [{ jobId: 1, jobName: '任务', jobType: 0, cron: null, bucket: 0, total: 50, failed: 0 }] };
  let finish!: (value: TimelineResult) => void;
  const windowRequest = new Promise<TimelineResult>((resolve) => { finish = resolve; });
  const completed = vi.fn();
  const result = loadTimelineSnapshot(1, async () => day, () => windowRequest).then(completed);
  await Promise.resolve(); await Promise.resolve();
  expect(completed).not.toHaveBeenCalled();
  finish(empty); await result;
  expect(completed).toHaveBeenCalledWith({ day, window: empty });
});

it('全天或没有聚合时复用全天数据，不请求窗口', async () => {
  const loadWindow = vi.fn();
  expect(await loadTimelineSnapshot(1, async () => empty, loadWindow)).toEqual({ day: empty, window: empty });
  expect(await loadTimelineSnapshot(24, async () => empty, loadWindow)).toEqual({ day: empty, window: empty });
  expect(loadWindow).not.toHaveBeenCalled();
});

it('窗口请求失败时不返回不完整的快照', async () => {
  const day = { ...empty, buckets: [{ jobId: 1, jobName: '任务', jobType: 0, cron: null, bucket: 0, total: 50, failed: 0 }] };
  await expect(loadTimelineSnapshot(1, async () => day, async () => { throw new Error('请求失败'); })).rejects.toThrow('请求失败');
});
