import {GATE_APP} from '@/configs';
import {BaseApi} from '@fa/ui';
import {Admin} from '@/types';
import { Fa } from "@fa/ui/src";

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
class LogApiApi extends BaseApi<Admin.LogApi, string> {

  /** 全部删除 */
  deleteAll = (): Promise<Fa.Ret> => this.delete('deleteAll');

}

export default new LogApiApi(GATE_APP.admin, 'logApi');
