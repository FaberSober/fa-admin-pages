import { GATE_APP } from '@/configs';
import { BaseApi } from '@fa/ui';
import { Admin } from '@/types';

/** ------------------------------------------ BASE-告警信息 操作接口 ------------------------------------------ */
class Api extends BaseApi<Admin.Alert, number> {}

export default new Api(GATE_APP.admin, 'alert');
