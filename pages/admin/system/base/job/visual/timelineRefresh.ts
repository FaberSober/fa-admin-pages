import type { TimelineResult } from './timeline';

/** 全天与窗口数据准备齐后一次性更新，避免刷新时切换到临时聚合结果。 */
export async function loadTimelineSnapshot(hours: number, loadDay: () => Promise<TimelineResult>, loadWindow: () => Promise<TimelineResult>) {
  const day = await loadDay();
  const window = hours !== 24 && !!day.buckets?.length ? await loadWindow() : day;
  return { day, window };
}
