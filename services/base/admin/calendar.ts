import { BaseApi } from '@fa/ui';
import { GATE_APP } from '@/configs';
import type { Admin } from '@/types';

/** ------------------------------------------ 统一日历定义操作接口 ------------------------------------------ */
class CalendarApi extends BaseApi<Admin.BaseCalendar, number> {}

export default new CalendarApi(GATE_APP.calendar, 'calendar/definition');
