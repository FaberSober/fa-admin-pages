import type { Admin } from '@/types';
const count = (value: unknown): number | undefined => {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : undefined;
};
export function normalizeHistoryStats(stats: Admin.JobFlowHistoryStats) {
  const samples = count(stats.durationSamples);
  const average = count(stats.avgDurationMs);
  return {
    total: count(stats.total), doing: count(stats.doing), success: count(stats.success), failed: count(stats.failed), unconfirmed: count(stats.unconfirmed), durationSamples: samples,
    avgDurationMs: samples !== undefined && samples > 0 && average !== undefined && Number.isFinite(average) && average >= 0 ? average : undefined,
  };
}
export function formatHistoryDuration(value?: number) {
  if (value === undefined || !Number.isFinite(value) || value < 0) return '—';
  return value < 1000 ? `${Number(value.toFixed(1))} ms` : `${Number((value / 1000).toFixed(2))} s`;
}
