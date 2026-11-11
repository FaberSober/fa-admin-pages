import { expect, it } from 'vitest';
import { timelineModel, timelineWindow, type TimelineEntry } from './timeline';

it('按任务分组并在当天边界截断，缺少结束时间不虚构耗时', () => {
  const entry: TimelineEntry = { id: 1, jobId: 5, jobName: '任务', jobType: 0, cron: '0 * * * * ?', beginTime: '2026-11-11T23:50:00', endTime: '2026-11-12T00:10:00', durationMs: 1200000, duration: 1200, status: 2 };
  const result = timelineModel([entry, { ...entry, id: 2, beginTime: '2026-11-11T12:00:00', endTime: null, status: 1 }], '2026-11-11');
  expect(result.names).toEqual(['任务']);
  expect(result.rows[0].end).toBe(86400);
  expect(result.rows[1].begin).toBe(result.rows[1].end);
});

it('时间窗口限制在当天范围内', () => {
  expect(timelineWindow(1, 90000)).toEqual({ start: 82800, end: 86400 });
  expect(timelineWindow(6, -1)).toEqual({ start: 0, end: 21600 });
});
