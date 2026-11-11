import dayjs from 'dayjs';
import { formatJobCount, formatJobDuration, parseJobLong } from '../jobStatistics';

type LongValue = string | number | null | undefined;
export type TimelineEntry = {
  id: number; jobId: number | null; jobName: string | null; jobType: number | null; cron: string | null; beginTime: string; endTime: string | null;
  durationMs: number | null; duration: number | null; status: number;
};
/** 后端 Long 可能以字符串传输。finished 为已结束执行数，用作成功率分母。 */
export type TimelineStats = { total: LongValue; success: LongValue; failed: LongValue; finished: LongValue; avgDurationMs: LongValue; maxDurationMs: LongValue };
export type TimelineResult = { serverTime: string; entries: TimelineEntry[]; stats: TimelineStats };
export type TimelineFilter = { type?: number; status?: number; keyword?: string };

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
export function timelineModel(entries: TimelineEntry[], date: string) {
  const start = dayjs(`${date}T00:00:00`);
  const names: string[] = [];
  const groups = new Map<string, number>();
  const rows = entries.map((entry) => {
    const key = entry.jobId == null ? `log:${entry.id}` : `job:${entry.jobId}`;
    let row = groups.get(key);
    if (row === undefined) {
      row = names.length;
      groups.set(key, row);
      names.push(entry.jobName || (entry.jobId == null ? `记录 #${entry.id}` : `任务 #${entry.jobId}`));
    }
    const begin = Math.max(0, Math.min(86400, dayjs(entry.beginTime).diff(start, 'second')));
    const end = entry.endTime ? Math.max(begin, Math.min(86400, dayjs(entry.endTime).diff(start, 'second'))) : begin;
    return { entry, row, begin, end };
  });
  return { names, rows };
}

export function timelineWindow(hours: number, offset: number) {
  const width = hours * 3600;
  const start = Math.max(0, Math.min(86400 - width, offset));
  return { start, end: start + width };
}
