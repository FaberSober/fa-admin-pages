import dayjs from 'dayjs';
import { formatJobCount, formatJobDuration, parseJobLong } from '../jobStatistics';

type LongValue = string | number | null | undefined;
export type TimelineEntry = {
  id: number; jobId: number | null; jobName: string | null; jobType: number | null; cron: string | null; beginTime: string; endTime: string | null;
  durationMs: number | null; duration: number | null; status: number; crossDay?: boolean;
};
/** 后端 Long 可能以字符串传输。finished 为已结束执行数，用作成功率分母。 */
export type TimelineStats = { total: LongValue; success: LongValue; failed: LongValue; finished: LongValue; avgDurationMs: LongValue; maxDurationMs: LongValue };
/** 高频任务的 15 分钟聚合桶；bucket 为当天第几个 15 分钟（0–95）。 */
export type TimelineBucket = { jobId: number; jobName: string | null; jobType: number | null; cron: string | null; bucket: number; total: LongValue; failed: LongValue };
/** entries 为当前窗口内未聚合任务的明细，buckets 为窗口内高频任务的聚合；stats 始终按整天统计。 */
export type TimelineResult = { serverTime: string; entries: TimelineEntry[]; buckets?: TimelineBucket[]; stats: TimelineStats };
export type TimelineFilter = { type?: number; status?: number; keyword?: string };
export type PlanItem = { jobId: number; jobName: string | null; jobType: number | null; cron: string | null; paused: boolean; start: number; end: number; durationMs: number | string | null; count: number };
/** 时间窗口（当天第几秒）；全天时不传，由后端按整天处理。 */
export type TimelineWindowParams = { windowStart?: number; windowEnd?: number };
export const BUCKET_SECONDS = 900;
export const TIMELINE_ROW_HEIGHT = 44;

/** 大任务列表只绘制可见行，滚动容器仍保留完整高度。 */
export function timelineVisibleRows(total: number, scrollTop: number, viewportHeight: number) {
  if (total <= 300) return { start: 0, end: total, offset: 0, virtual: false };
  const safeHeight = Math.max(TIMELINE_ROW_HEIGHT, viewportHeight);
  const safeScroll = Math.max(0, Math.min(scrollTop, Math.max(0, total * TIMELINE_ROW_HEIGHT + 36 - safeHeight)));
  const start = Math.min(total - 1, Math.floor(safeScroll / TIMELINE_ROW_HEIGHT));
  const end = Math.min(total, start + Math.ceil(safeHeight / TIMELINE_ROW_HEIGHT) + 2);
  return { start, end, offset: safeScroll - start * TIMELINE_ROW_HEIGHT, virtual: true };
}

/** 聚合块居于一小时窗口中，靠近当天边界时限制在有效范围内。 */
export function bucketDetailWindow(bucket: number) {
  return timelineWindow(1, bucket * BUCKET_SECONDS - 1800 + BUCKET_SECONDS / 2);
}

export const timelineTypeOptions = [{ label: '普通任务', value: 0 }, { label: '任务流', value: 1 }];
export const timelineStatusOptions = [
  { label: '成功', value: 2 }, { label: '失败', value: 9 }, { label: '执行中', value: 1 },
  { label: '停止中', value: 3 }, { label: '已停止', value: 7 }, { label: '未确认', value: 8 },
];

export function timelineStatCards(stats?: TimelineStats | null) {
  const success = parseJobLong(stats?.success);
  const finished = parseJobLong(stats?.finished);
  const rate = success !== undefined && finished ? `${Number((Number(success) * 100 / Number(finished)).toFixed(1))}%` : '—';
  return [
    { label: '总执行', value: formatJobCount(stats?.total) },
    { label: '成功', value: formatJobCount(stats?.success) },
    { label: '失败', value: formatJobCount(stats?.failed) },
    { label: '成功率', value: rate },
    { label: '平均耗时', value: formatJobDuration(stats?.avgDurationMs) },
    { label: '最长耗时', value: formatJobDuration(stats?.maxDurationMs) },
  ];
}
export function timelineModel(entries: TimelineEntry[], date: string, buckets: TimelineBucket[] = [], now?: string, fullDay?: TimelineResult, plans: PlanItem[] = []) {
  const start = dayjs(`${date}T00:00:00`);
  const names: string[] = [];
  /** 每个 Y 轴行的类型与 cron，明细行和聚合行共用。 */
  const meta: { jobType: number | null; cron: string | null }[] = [];
  const groups = new Map<string, number>();
  const rowOf = (key: string, name: string, jobType: number | null, cron: string | null) => {
    let row = groups.get(key);
    if (row === undefined) {
      row = names.length;
      groups.set(key, row);
      names.push(name);
      meta.push({ jobType, cron });
    }
    return row;
  };
  const current = now && dayjs(now).format('YYYY-MM-DD') === date ? dayjs(now).hour() * 3600 + dayjs(now).minute() * 60 + dayjs(now).second() : -1;
  const activePlans = plans.filter((plan) => plan.end > plan.start ? plan.end > current : plan.start > current);
  const seedMap = new Map<string, { id: number | null; key: string; name: string; jobType: number | null; cron: string | null }>();
  const seed = (id: number | null, key: string, name: string, jobType: number | null, cron: string | null) => {
    if (!seedMap.has(key)) seedMap.set(key, { id, key, name, jobType, cron });
  };
  for (const entry of fullDay?.entries ?? entries) seed(entry.jobId, entry.jobId == null ? `log:${entry.id}` : `job:${entry.jobId}`,
    entry.jobName || (entry.jobId == null ? `记录 #${entry.id}` : `任务 #${entry.jobId}`), entry.jobType, entry.cron);
  for (const bucket of fullDay?.buckets ?? buckets) seed(bucket.jobId, `job:${bucket.jobId}`, bucket.jobName || `任务 #${bucket.jobId}`, bucket.jobType, bucket.cron);
  const executionKeys = new Set(seedMap.keys());
  for (const entry of entries) executionKeys.add(entry.jobId == null ? `log:${entry.id}` : `job:${entry.jobId}`);
  for (const bucket of buckets) if (current < 0 || bucket.bucket * BUCKET_SECONDS <= current) executionKeys.add(`job:${bucket.jobId}`);
  for (const plan of activePlans) seed(plan.jobId, `job:${plan.jobId}`, plan.jobName || `任务 #${plan.jobId}`, plan.jobType, plan.cron);
  const seeds = Array.from(seedMap.values());
  seeds.sort((a, b) => (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER) || a.key.localeCompare(b.key));
  seeds.forEach((seed) => { rowOf(seed.key, seed.name, seed.jobType, seed.cron); });
  const rows = entries.map((entry) => {
    const row = rowOf(entry.jobId == null ? `log:${entry.id}` : `job:${entry.jobId}`,
      entry.jobName || (entry.jobId == null ? `记录 #${entry.id}` : `任务 #${entry.jobId}`), entry.jobType, entry.cron);
    const begin = Math.max(0, Math.min(86400, dayjs(entry.beginTime).diff(start, 'second')));
    const running = entry.status === 1 || entry.status === 3;
    const endTime = running ? now : entry.endTime;
    const end = endTime ? Math.max(begin, Math.min(86400, dayjs(endTime).diff(start, 'second'))) : begin;
    return { entry, row, begin, end, running };
  });
  const bucketRows = buckets.filter((bucket) => current < 0 || bucket.bucket * BUCKET_SECONDS <= current).map((bucket) => {
    const row = rowOf(`job:${bucket.jobId}`, bucket.jobName || `任务 #${bucket.jobId}`, bucket.jobType, bucket.cron);
    const total = Number(parseJobLong(bucket.total) ?? 0);
    const failed = Number(parseJobLong(bucket.failed) ?? 0);
    const begin = bucket.bucket * BUCKET_SECONDS;
    const end = current < 0 ? begin + BUCKET_SECONDS : Math.min(begin + BUCKET_SECONDS, current);
    return { bucket, row, begin, end, total, failed };
  });
  const planRows = activePlans.map((plan) => {
    const row = rowOf(`job:${plan.jobId}`, plan.jobName || `任务 #${plan.jobId}`, plan.jobType, plan.cron);
    const begin = Math.max(plan.start, current);
    const duration = Math.max(0, Number(plan.durationMs) || 0) / 1000;
    return { plan, row, begin, end: Math.min(86400, plan.end > plan.start ? plan.end : begin + duration) };
  });
  return { names, meta, rows, bucketRows, planRows, jobRows: groups, executionCount: executionKeys.size };
}

export function timelineClickTarget(seriesName: string, dataIndex: number, model: ReturnType<typeof timelineModel>) {
  if (seriesName === '执行记录') {
    const entry = model.rows[dataIndex]?.entry;
    return entry ? { type: 'detail' as const, entry } : null;
  }
  if (seriesName === '聚合执行') {
    const bucket = model.bucketRows[dataIndex]?.bucket;
    return bucket ? { type: 'zoom' as const, start: bucketDetailWindow(bucket.bucket).start } : null;
  }
  return null;
}

export function sliceTimelineModel(model: ReturnType<typeof timelineModel>, start: number, end: number) {
  const inView = (row: { row: number }) => row.row >= start && row.row < end;
  return {
    ...model,
    names: model.names.slice(start, end),
    meta: model.meta.slice(start, end),
    rows: model.rows.filter(inView).map((row) => ({ ...row, row: row.row - start })),
    bucketRows: model.bucketRows.filter(inView).map((row) => ({ ...row, row: row.row - start })),
    planRows: model.planRows.filter(inView).map((row) => ({ ...row, row: row.row - start })),
  };
}

/** 根据可见窗口聚合密集计划，避免全天计划点相互覆盖。 */
export function visiblePlanRows(rows: ReturnType<typeof timelineModel>['planRows'], window: { start: number; end: number }) {
  const visible = rows.filter((row) => row.begin < window.end && row.end >= window.start);
  const counts = new Map<number, number>();
  for (const row of visible) {
    if (row.plan.end === row.plan.start) counts.set(row.plan.jobId, (counts.get(row.plan.jobId) ?? 0) + 1);
  }
  const limit = window.end - window.start <= 3600 ? 60 : 40;
  const result: typeof rows = [];
  const groups = new Map<string, (typeof rows)[number]>();
  for (const row of visible) {
    if (row.plan.end > row.plan.start || (counts.get(row.plan.jobId) ?? 0) <= limit) {
      result.push(row);
      continue;
    }
    const bucket = Math.floor(row.begin / BUCKET_SECONDS);
    const key = `${row.plan.jobId}:${bucket}`;
    const existing = groups.get(key);
    if (existing) {
      existing.begin = Math.min(existing.begin, row.begin);
      existing.plan.start = existing.begin;
      existing.plan.count += 1;
    } else {
      const begin = row.begin;
      const end = Math.min((bucket + 1) * BUCKET_SECONDS, window.end);
      groups.set(key, { ...row, begin, end, plan: { ...row.plan, start: begin, end, count: 1 } });
    }
  }
  return [...result, ...groups.values()];
}

/** 聚合块透明度：次数越多越深，最小 0.25，保证少量记录仍可见。 */
export function bucketOpacity(total: number, maxTotal: number) {
  return maxTotal > 0 ? 0.25 + 0.75 * Math.min(1, total / maxTotal) : 0.25;
}

export function timelineWindow(hours: number, offset: number) {
  const width = hours * 3600;
  const start = Math.max(0, Math.min(86400 - width, offset));
  return { start, end: start + width };
}

export function timelineRangeOffset(hours: number, offset: number) {
  return hours === 24 ? offset : timelineWindow(hours, offset).start;
}
