import { GATE_APP } from '@/configs';
import { BaseApi } from '@fa/ui';
import { Admin } from '@/types';

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
class Api extends BaseApi<Admin.FileBiz, number> {}

export default new Api(GATE_APP.admin, 'fileBiz');
