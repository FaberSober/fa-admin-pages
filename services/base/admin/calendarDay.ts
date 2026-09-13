import { BaseApi, type Fa } from '@fa/ui';
import { GATE_APP } from '@/configs';
import type { Admin } from '@/types';

/** ------------------------------------------ 统一日历日期事实操作接口 ------------------------------------------ */
class CalendarDayApi extends BaseApi<Admin.BaseCalendarDay, number> {
  /** 查询指定日历的年度日期事实 */
  year = (calendarCode: string, year: number): Promise<Fa.Ret<Admin.BaseCalendarDay[]>> => this.get('day/year', { calendarCode, year });

  /** 预览导入差异 */
  preview = (params: Admin.CalendarDayImportRequest): Promise<Fa.Ret<Admin.CalendarDayImportPreview>> => this.post('day/preview', params);

  /** 发布导入批次 */
  publish = (params: Admin.CalendarDayImportRequest): Promise<Fa.Ret<Admin.CalendarDayImportPreview>> => this.post('day/publish', params);

  /** 批量保存日期事实 */
  upsertBatch = (params: Admin.CalendarDayImportRequest): Promise<Fa.Ret<Admin.BaseCalendarDay[]>> => this.post('day/upsertBatch', params);

  /** 预览外部源生成的当前年度 OA/A 股日历 */
  previewExternal = (year: number): Promise<Fa.Ret<Admin.CalendarExternalImportPreview>> => this.post('day/external/preview', { year });

  /** 发布外部源生成的当前年度 OA/A 股日历 */
  publishExternal = (params: Admin.CalendarExternalImportPublishRequest): Promise<Fa.Ret<Admin.CalendarExternalImportPreview>> =>
    this.post('day/external/publish', params);
}

export default new CalendarDayApi(GATE_APP.calendar, 'calendar');
