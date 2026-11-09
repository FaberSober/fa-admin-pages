import { expect, it } from 'vitest';
import type { Admin } from '@/types';
import { buildExecutionSlices, buildExecutionTimeline, getNodeDurationMs, parseExecutionTime } from './flowExecutionTimeline';
const node = (id: number, overrides: Partial<Admin.JobFlowNodeRun> = {}): Admin.JobFlowNodeRun => ({ id, flowLogId: 1, nodeId: `node-${id}`, clazzPath: 'example.Task', nodeName: '同名任务', attempt: 1, status: 40, beginTime: '2026-11-09 10:00:00', endTime: '2026-11-09 10:00:02', ...overrides });
it('sorts parallel records by time, retaining independent IDs without mutation', () => {
  const input = [node(1, { beginTime: '2026-11-09 10:00:01' }), node(2)]; const before = JSON.stringify(input);
  expect(buildExecutionTimeline(input).events.map(event => event.key)).toEqual(['2:begin', '1:begin', '1:end', '2:end']); expect(JSON.stringify(input)).toBe(before);
});
it('never infers completion or duration for active and unconfirmed records', () => {
  for (const status of [20, 30, 80]) { const record = node(status, { status }); expect(getNodeDurationMs(record)).toBeUndefined(); expect(buildExecutionTimeline([record]).events.map(event => event.kind)).toEqual(['begin']); }
});
it('rejects invalid calendar values and reversed intervals', () => {
  expect(parseExecutionTime('2026-02-30 10:00:00')).toBeUndefined(); expect(parseExecutionTime('2026-11-09 25:00:00')).toBeUndefined(); expect(parseExecutionTime('bad')).toBeUndefined();
  const record = node(1, { endTime: '2026-11-09 09:00:00' }); expect(getNodeDurationMs(record)).toBeUndefined(); expect(buildExecutionTimeline([record]).events).toHaveLength(1);
});
it('supports ISO timezone offsets and confirmed terminal durations', () => {
  for (const status of [40, 50, 70]) expect(getNodeDurationMs(node(1, { status, beginTime: '2026-11-09T10:00:00+08:00', endTime: '2026-11-09T02:00:02Z' }))).toBe(2000);
});
it('keeps untimed blocked nodes separate without fabricated timestamps', () => {
  const record = node(1, { status: 60, beginTime: undefined, endTime: undefined, reason: '前驱失败' }); expect(buildExecutionTimeline([record])).toEqual({ events: [], undated: [record] }); expect(buildExecutionTimeline([])).toEqual({ events: [], undated: [] });
});

it('groups each node into one slice with shared relative time without inventing unknown ends', () => {
  const rows = [
    { id: 1, nodeId: 'a', status: 40, beginTime: '2026-11-09 10:00:00', endTime: '2026-11-09 10:00:10' },
    { id: 2, nodeId: 'b', status: 80, beginTime: '2026-11-09 10:00:05', endTime: '2026-11-09 10:00:20' },
    { id: 3, nodeId: 'c', status: 60 },
  ] as Admin.JobFlowNodeRun[];
  const before = JSON.stringify(rows);
  const slices = buildExecutionSlices(rows);
  expect(slices).toHaveLength(3);
  expect(slices[0]).toMatchObject({ offset: 0, width: 100, duration: 10000 });
  expect(slices[1]).toMatchObject({ offset: 50, width: undefined, duration: undefined });
  expect(slices[2].offset).toBeUndefined();
  expect(JSON.stringify(rows)).toBe(before);
});
