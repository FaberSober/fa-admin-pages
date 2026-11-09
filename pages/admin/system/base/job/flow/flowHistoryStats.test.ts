import { expect, it } from 'vitest';
import { formatHistoryDuration, normalizeHistoryStats } from './flowHistoryStats';

const baseline = { stopping: '0', stopped: '2', total: '4', success: '1', failed: '1', doing: '1', unconfirmed: '1', durationSamples: '2', avgDurationMs: '1501' };
it('normalizes serialized Long counts and average duration', () => {
  expect(normalizeHistoryStats(baseline)).toEqual({ stopping: 0, stopped: 2, total: 4, success: 1, failed: 1, doing: 1, unconfirmed: 1, durationSamples: 2, avgDurationMs: 1501 });
});
it('distinguishes empty statistics from a valid zero duration', () => {
  expect(normalizeHistoryStats({ ...baseline, total: 0, durationSamples: 0, avgDurationMs: null }).avgDurationMs).toBeUndefined();
  expect(normalizeHistoryStats({ ...baseline, durationSamples: 1, avgDurationMs: 0 }).avgDurationMs).toBe(0);
});
it('does not turn invalid counts or durations into zero', () => {
  for (const value of ['', ' ', '-1', 'NaN', 'Infinity', '1.2', '9007199254740992']) {
    const stats = normalizeHistoryStats({ ...baseline, total: value, avgDurationMs: value });
    expect(stats.total).toBeUndefined(); expect(stats.avgDurationMs).toBeUndefined();
  }
});
it('formats a missing average, milliseconds and seconds', () => {
  expect(formatHistoryDuration()).toBe('—'); expect(formatHistoryDuration(Number.NaN)).toBe('—');
  expect(formatHistoryDuration(0)).toBe('0 ms'); expect(formatHistoryDuration(999)).toBe('999 ms');
  expect(formatHistoryDuration(1501)).toBe('1.5 s');
});
