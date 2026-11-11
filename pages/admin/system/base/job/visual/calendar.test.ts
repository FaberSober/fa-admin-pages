import { describe, expect, it } from 'vitest';
import { calendarStatus } from './calendar';

describe('日历执行状态', () => {
  it('仅全部成功时显示绿色，有失败显示红色，其余不显示角标', () => {
    const day = { date: '2024-02-01', total: 2, success: 2, failed: 0 };
    expect(calendarStatus(day)).toBe('success');
    expect(calendarStatus({ ...day, success: 1, failed: 1 })).toBe('error');
    expect(calendarStatus({ ...day, success: 1 })).toBeUndefined();
    expect(calendarStatus(undefined)).toBeUndefined();
  });
});
