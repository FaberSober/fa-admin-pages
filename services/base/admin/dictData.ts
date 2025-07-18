import { GATE_APP } from '@/configs';
import { BaseTreeApi } from '@fa/ui';
import { Admin } from '@/types';
import type { Fa } from "@fa/ui/src";

/** ------------------------------------------ BASE-字典值 操作接口 ------------------------------------------ */
class Api extends BaseTreeApi<Admin.DictData, number> {

  /** 切换默认 */
  toggleDefaultById = (id: number): Promise<Fa.Ret<boolean>> => this.get(`toggleDefaultById/${id}`);

}

export default new Api(GATE_APP.admin, 'dictData');
