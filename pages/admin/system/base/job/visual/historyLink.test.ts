import { expect, it, vi } from 'vitest';
import { historyTimelinePath, parseTimelineLink, scheduleTimelineRefresh, shouldRefreshToday } from './historyLink';

it('历史记录跳转包含开始日期和任务 ID，并拒绝缺失信息', () => {
  expect(historyTimelinePath(7, '2026-11-11 23:50:00')).toBe('/admin/system/base/job/visual?date=2026-11-11&jobId=7');
  expect(historyTimelinePath(0, '2026-11-11')).toBeUndefined();
  expect(historyTimelinePath(7, null)).toBeUndefined();
  expect(historyTimelinePath(7, 'invalid')).toBeUndefined();
});

it('仅接受有效日期和正整数任务 ID', () => {
  expect(parseTimelineLink('2026-11-11', '7')).toEqual({ date: '2026-11-11', jobId: 7 });
  expect(parseTimelineLink('2026-02-30', '7')).toBeUndefined();
  expect(parseTimelineLink('2026-11-11', '0')).toBeUndefined();
  expect(parseTimelineLink('2026-11-11', ['7'])).toBeUndefined();
});

it('只有开启、今天、活动标签且浏览器可见时才自动刷新', () => {
  const date = '2026-11-11';
  expect(shouldRefreshToday(true, date, date, true, true)).toBe(true);
  expect(shouldRefreshToday(false, date, date, true, true)).toBe(false);
  expect(shouldRefreshToday(true, date, '2026-11-12', true, true)).toBe(false);
  expect(shouldRefreshToday(true, date, date, false, true)).toBe(false);
  expect(shouldRefreshToday(true, date, date, true, false)).toBe(false);
});

it('每 30 秒刷新可见页面，隐藏时跳过，停止后清除定时器', () => {
  vi.useFakeTimers();
  try {
    const state = { date: '2026-11-11', today: '2026-11-11', active: true, visible: true };
    const refresh = vi.fn(); const expire = vi.fn();
    const stop = scheduleTimelineRefresh(() => state, refresh, expire);
    vi.advanceTimersByTime(29999); expect(refresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(refresh).toHaveBeenCalledTimes(1);
    state.visible = false; vi.advanceTimersByTime(30000); expect(refresh).toHaveBeenCalledTimes(1);
    state.visible = true; state.today = '2026-11-12'; vi.advanceTimersByTime(30000); expect(expire).toHaveBeenCalledOnce();
    stop(); vi.advanceTimersByTime(30000); expect(expire).toHaveBeenCalledOnce();
  } finally { vi.useRealTimers(); }
});
