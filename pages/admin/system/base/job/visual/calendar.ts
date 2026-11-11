export type CalendarDay = { date: string; total: number; success: number; failed: number };

export function calendarStatus(day: CalendarDay | undefined): 'error' | 'success' | undefined {
  if (!day || day.total === 0) return undefined;
  if (day.failed > 0) return 'error';
  if (day.success === day.total) return 'success';
  return undefined;
}
