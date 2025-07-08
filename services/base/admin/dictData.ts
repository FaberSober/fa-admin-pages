import { GATE_APP } from '@/configs';
import { BaseTreeApi } from '@fa/ui';
import { Admin } from '@/types';

/** ------------------------------------------ BASE-字典值 操作接口 ------------------------------------------ */
class Api extends BaseTreeApi<Admin.DictData, number> {}

export default new Api(GATE_APP.admin, 'dictData');
