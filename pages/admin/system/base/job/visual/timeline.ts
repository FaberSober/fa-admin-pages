import dayjs from 'dayjs';

export type TimelineEntry = {
  id: number; jobId: number | null; jobName: string | null; jobType: number | null; cron: string | null; beginTime: string; endTime: string | null;
  durationMs: number | null; duration: number | null; status: number;
};
export type TimelineResult = { serverTime: string; entries: TimelineEntry[] };

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
