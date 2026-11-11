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
/** 时间窗口（当天第几秒）；全天时不传，由后端按整天处理。 */
export type TimelineWindowParams = { windowStart?: number; windowEnd?: number };
export const BUCKET_SECONDS = 900;

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
export function timelineModel(entries: TimelineEntry[], date: string, buckets: TimelineBucket[] = [], now?: string, fullDay?: TimelineResult) {
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
  fullDay?.entries.forEach((entry) => { rowOf(entry.jobId == null ? `log:${entry.id}` : `job:${entry.jobId}`,
    entry.jobName || (entry.jobId == null ? `记录 #${entry.id}` : `任务 #${entry.jobId}`), entry.jobType, entry.cron); });
  fullDay?.buckets?.forEach((bucket) => { rowOf(`job:${bucket.jobId}`, bucket.jobName || `任务 #${bucket.jobId}`, bucket.jobType, bucket.cron); });
  const rows = entries.map((entry) => {
    const row = rowOf(entry.jobId == null ? `log:${entry.id}` : `job:${entry.jobId}`,
      entry.jobName || (entry.jobId == null ? `记录 #${entry.id}` : `任务 #${entry.jobId}`), entry.jobType, entry.cron);
    const begin = Math.max(0, Math.min(86400, dayjs(entry.beginTime).diff(start, 'second')));
    const running = entry.status === 1 || entry.status === 3;
    const endTime = running ? now : entry.endTime;
    const end = endTime ? Math.max(begin, Math.min(86400, dayjs(endTime).diff(start, 'second'))) : begin;
    return { entry, row, begin, end, running };
  });
  const bucketRows = buckets.map((bucket) => {
    const row = rowOf(`job:${bucket.jobId}`, bucket.jobName || `任务 #${bucket.jobId}`, bucket.jobType, bucket.cron);
    const total = Number(parseJobLong(bucket.total) ?? 0);
    const failed = Number(parseJobLong(bucket.failed) ?? 0);
    const begin = bucket.bucket * BUCKET_SECONDS;
    return { bucket, row, begin, end: begin + BUCKET_SECONDS, total, failed };
  });
  return { names, meta, rows, bucketRows };
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

/** 聚合块透明度：次数越多越深，最小 0.25，保证少量记录仍可见。 */
export function bucketOpacity(total: number, maxTotal: number) {
  return maxTotal > 0 ? 0.25 + 0.75 * Math.min(1, total / maxTotal) : 0.25;
}

export function timelineWindow(hours: number, offset: number) {
  const width = hours * 3600;
  const start = Math.max(0, Math.min(86400 - width, offset));
  return { start, end: start + width };
}
