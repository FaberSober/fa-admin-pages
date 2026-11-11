import { expect, it } from 'vitest';
import { bucketOpacity, timelineClickTarget, timelineModel, timelineRangeOffset, timelineStatCards, timelineWindow, visiblePlanRows, type TimelineEntry } from './timeline';

it('按任务分组并在当天边界截断，缺少结束时间不虚构耗时', () => {
  const entry: TimelineEntry = { id: 1, jobId: 5, jobName: '任务', jobType: 0, cron: '0 * * * * ?', beginTime: '2026-11-11T23:50:00', endTime: '2026-11-12T00:10:00', durationMs: 1200000, duration: 1200, status: 2 };
  const result = timelineModel([entry, { ...entry, id: 2, beginTime: '2026-11-11T12:00:00', endTime: null, status: 1 }], '2026-11-11');
  expect(result.names).toEqual(['任务']);
  expect(result.rows[0].end).toBe(86400);
  expect(result.rows[1].begin).toBe(result.rows[1].end);
});

it('跨天记录在相邻日期截断，只有执行中和停止中延伸到服务端当前时间', () => {
  const entry: TimelineEntry = { id: 1, jobId: 5, jobName: '任务', jobType: 0, cron: null, beginTime: '2026-11-11T23:50:00', endTime: '2026-11-12T00:10:00', durationMs: null, duration: null, status: 2, crossDay: true };
  expect(timelineModel([entry], '2026-11-11').rows[0]).toMatchObject({ begin: 85800, end: 86400, running: false });
  expect(timelineModel([entry], '2026-11-12').rows[0]).toMatchObject({ begin: 0, end: 600, running: false });
  const records = [1, 3, 8, 9].map((status) => ({ ...entry, status, endTime: null }));
  const rows = timelineModel(records, '2026-11-12', [], '2026-11-12T00:30:00').rows;
  expect(rows.map(row => row.end)).toEqual([1800, 1800, 0, 0]);
  expect(rows.map(row => row.running)).toEqual([true, true, false, false]);
});

it('时间窗口限制在当天范围内', () => {
  expect(timelineWindow(1, 90000)).toEqual({ start: 82800, end: 86400 });
  expect(timelineWindow(6, -1)).toEqual({ start: 0, end: 21600 });
});

it('切换范围时保留起点，超过当天边界时限制到最晚起点', () => {
  expect(timelineRangeOffset(1, 4 * 3600)).toBe(4 * 3600);
  expect(timelineRangeOffset(6, 23 * 3600)).toBe(18 * 3600);
  expect(timelineRangeOffset(24, 4 * 3600)).toBe(4 * 3600);
  expect(timelineRangeOffset(6, timelineRangeOffset(24, 4 * 3600))).toBe(4 * 3600);
});

it('聚合桶与明细按任务合并为同一行，桶按 15 分钟定位，失败数兼容字符串 Long', () => {
  const entry: TimelineEntry = { id: 1, jobId: 5, jobName: '低频', jobType: 0, cron: null, beginTime: '2026-11-11T01:00:00', endTime: '2026-11-11T01:00:01', durationMs: 1000, duration: 1, status: 2 };
  const model = timelineModel([entry], '2026-11-11', [
    { jobId: 9, jobName: '高频', jobType: 1, cron: '0 * * * * ?', bucket: 4, total: '15', failed: '1' },
    { jobId: 5, jobName: '低频', jobType: 0, cron: null, bucket: 5, total: 2, failed: 0 },
  ]);
  expect(model.names).toEqual(['低频', '高频']);
  expect(model.meta[1]).toEqual({ jobType: 1, cron: '0 * * * * ?' });
  expect(model.bucketRows[0]).toMatchObject({ row: 1, begin: 3600, end: 4500, total: 15, failed: 1 });
  expect(model.bucketRows[1].row).toBe(0);
});

it('窗口没有记录时保留全天任务行，并按全天顺序定位窗口明细', () => {
  const entry: TimelineEntry = { id: 1, jobId: 5, jobName: '低频', jobType: 0, cron: null, beginTime: '2026-11-11T12:00:00', endTime: '2026-11-11T12:00:01', durationMs: 1000, duration: 1, status: 2 };
  const bucket = { jobId: 9, jobName: '高频', jobType: 1, cron: '0 * * * * ?', bucket: 48, total: 50, failed: 1 };
  const day = { serverTime: '2026-11-11T12:00:00', entries: [entry], buckets: [bucket], stats: { total: 51, success: 50, failed: 1, finished: 51, avgDurationMs: 1000, maxDurationMs: 1000 } };
  const empty = timelineModel([], '2026-11-11', [], undefined, day);
  expect(empty.names).toEqual(['低频', '高频']);
  expect(empty.rows).toEqual([]);
  const model = timelineModel([{ ...entry, id: 2, jobId: 9, jobName: '高频' }], '2026-11-11', [], undefined, day);
  expect(model.names).toEqual(['低频', '高频']);
  expect(model.rows[0].row).toBe(1);
  expect(model.jobRows.get('job:9')).toBe(1);
  expect(model.meta[1]).toEqual({ jobType: 1, cron: bucket.cron });
});

it('任务从明细变为聚合后仍保持相同行顺序', () => {
  const entry: TimelineEntry = { id: 1, jobId: 5, jobName: '任务5', jobType: 0, cron: null, beginTime: '2026-11-11T12:00:00', endTime: null, durationMs: null, duration: null, status: 2 };
  const other = { ...entry, id: 2, jobId: 2, jobName: '任务2' };
  const bucket = { jobId: 2, jobName: '任务2', jobType: 0, cron: null, bucket: 48, total: 41, failed: 0 };
  const stats = { total: 42, success: 42, failed: 0, finished: 42, avgDurationMs: null, maxDurationMs: null };
  const before = { serverTime: '2026-11-11T12:00:00', entries: [entry, other], buckets: [], stats };
  const after = { ...before, entries: [entry], buckets: [bucket] };
  expect(timelineModel(before.entries, '2026-11-11', before.buckets, undefined, before).names).toEqual(['任务2', '任务5']);
  expect(timelineModel(after.entries, '2026-11-11', after.buckets, undefined, after).names).toEqual(['任务2', '任务5']);
});

it('计划任务加入时间轴，并过滤今天已过去的触发点', () => {
  const plan = { jobId: 9, jobName: '计划', jobType: 0, cron: '0 0 * * * ?', paused: true, start: 3600, end: 3600, count: 1, durationMs: 60000 };
  const today = timelineModel([], '2026-11-11', [], '2026-11-11T00:30:00', undefined, [plan]);
  expect(today.names).toEqual(['计划']);
  expect(today.planRows[0]).toMatchObject({ begin: 3600, end: 3660, plan: { paused: true } });
  expect(timelineModel([], '2026-11-11', [], '2026-11-11T01:30:00', undefined, [plan]).planRows).toEqual([]);
  expect(timelineModel([], '2026-11-12', [], '2026-11-11T23:00:00', undefined, [{ ...plan, start: 0, end: 0 }]).planRows).toHaveLength(1);
});

it('每分钟计划在全天及六小时视图分桶，放大到一小时显示明细', () => {
  const base = { jobId: 9, jobName: '计划', jobType: 0, cron: '0 * * * * ?', paused: false, count: 1, durationMs: 1000 };
  const plans = Array.from({ length: 1440 }, (_, index) => ({ ...base, start: index * 60, end: index * 60 }));
  const rows = timelineModel([], '2026-11-12', [], '2026-11-11T23:00:00', undefined, plans).planRows;
  const allDay = visiblePlanRows(rows, { start: 0, end: 86400 });
  expect(allDay).toHaveLength(96);
  expect(allDay[0].plan).toMatchObject({ start: 0, end: 900, count: 15 });
  const sixHours = visiblePlanRows(rows, { start: 14400, end: 36000 });
  expect(sixHours).toHaveLength(24);
  expect(sixHours.reduce((total, row) => total + row.plan.count, 0)).toBe(360);
  const oneHour = visiblePlanRows(rows, { start: 14400, end: 18000 });
  expect(oneHour).toHaveLength(60);
  expect(oneHour.every((row) => row.plan.start === row.plan.end)).toBe(true);
  expect(rows[0].plan.count).toBe(1);
});

it('聚合块透明度随次数递增且有下限', () => {
  expect(bucketOpacity(0, 0)).toBe(0.25);
  expect(bucketOpacity(1, 100)).toBeGreaterThan(0.25);
  expect(bucketOpacity(100, 100)).toBe(1);
  expect(bucketOpacity(200, 100)).toBe(1);
});

it('当天的执行聚合块不会延伸到当前时刻之后', () => {
  const buckets = [48, 49].map((bucket) => ({ jobId: 9, jobName: '任务', jobType: 0, cron: null, bucket, total: 10, failed: 0 }));
  const rows = timelineModel([], '2026-11-11', buckets, '2026-11-11T12:07:00').bucketRows;
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ begin: 43200, end: 43620 });
});

it('点击明细打开对应执行记录，点击聚合块定位到包含该块的一小时窗口', () => {
  const entry: TimelineEntry = { id: 8, jobId: 5, jobName: '失败任务', jobType: 0, cron: null, beginTime: '2026-11-11T01:00:00', endTime: '2026-11-11T01:00:01', durationMs: 1000, duration: 1, status: 9 };
  const model = timelineModel([entry], '2026-11-11', [
    { jobId: 9, jobName: '高频', jobType: 0, cron: null, bucket: 0, total: 41, failed: 1 },
    { jobId: 9, jobName: '高频', jobType: 0, cron: null, bucket: 95, total: 41, failed: 0 },
  ]);
  expect(timelineClickTarget('执行记录', 0, model)).toEqual({ type: 'detail', entry });
  expect(timelineClickTarget('聚合执行', 0, model)).toEqual({ type: 'zoom', start: 0 });
  expect(timelineClickTarget('聚合执行', 1, model)).toEqual({ type: 'zoom', start: 82800 });
  expect(timelineClickTarget('执行记录', 4, model)).toBeNull();
  expect(timelineClickTarget('当前时刻', 0, model)).toBeNull();
});

it('统计卡片按已结束执行计算成功率，兼容字符串 Long 与空统计', () => {
  const cards = timelineStatCards({ total: '4', success: '2', failed: '1', finished: '3', avgDurationMs: '1500', maxDurationMs: 3000 });
  expect(cards.map((card) => card.value)).toEqual(['4', '2', '1', '66.7%', '1.5 秒', '3 秒']);
  expect(timelineStatCards({ total: 0, success: 0, failed: 0, finished: 0, avgDurationMs: null, maxDurationMs: null }).map((card) => card.value))
    .toEqual(['0', '0', '0', '—', '—', '—']);
  expect(timelineStatCards(null)[0]).toEqual({ label: '总执行', value: '—' });
});
