import {GATE_APP} from '@/configs';
import {BaseApi} from '@fa/ui';
import {Admin} from '@/types';
import {Fa} from "@fa/ui/src";

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
class LogLoginApi extends BaseApi<Admin.LogLogin, number> {

  /** 按天统计 */
  countByDay = (params: { startDate:string,endDate:string }): Promise<Fa.Ret<Fa.ChartSeriesVo[]>> => this.post('countByDay', params);

}

export default new LogLoginApi(GATE_APP.admin, 'logLogin');
