import type { Dayjs } from 'dayjs';
export function historyFilters(values: { logId?: number | null; status?: number; triggerSource?: number; range?: [Dayjs, Dayjs] | null }) {
  return {
    logId: values.logId ?? undefined,
    status: values.status,
    triggerSource: values.triggerSource,
    beginTimeFrom: values.range?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
    beginTimeTo: values.range?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
  };
}
