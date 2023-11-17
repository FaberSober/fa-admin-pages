import { GATE_APP } from '@/configs';
import { Admin } from '@/types';
import { BaseApi } from '@fa/ui';

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
class Api extends BaseApi<Admin.FileBiz, number> {}

export default new Api(GATE_APP.admin, 'fileBiz');
