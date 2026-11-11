import dayjs from 'dayjs';

export function historyTimelinePath(jobId: number, beginTime?: string | null) {
  const date = dayjs(beginTime);
  if (!beginTime || !date.isValid() || !Number.isSafeInteger(jobId) || jobId <= 0) return undefined;
  const query = new URLSearchParams({ date: date.format('YYYY-MM-DD'), jobId: String(jobId) });
  return `/admin/system/base/job/visual?${query}`;
}

export function parseTimelineLink(date: unknown, jobId: unknown) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || dayjs(date).format('YYYY-MM-DD') !== date) return undefined;
  if (typeof jobId !== 'string' || !/^[1-9]\d*$/.test(jobId)) return undefined;
  const id = Number(jobId);
  return Number.isSafeInteger(id) ? { date, jobId: id } : undefined;
}

export function shouldRefreshToday(enabled: boolean, date: string, today: string, active: boolean, visible: boolean) {
  return enabled && date === today && active && visible;
}

export function scheduleTimelineRefresh(readState: () => { date: string; today: string; active: boolean; visible: boolean }, refresh: () => void, expire: () => void) {
  const timer = setInterval(() => {
    const { date, today, active, visible } = readState();
    if (date !== today) { expire(); return; }
    if (shouldRefreshToday(true, date, today, active, visible)) refresh();
  }, 30000);
  return () => clearInterval(timer);
}
