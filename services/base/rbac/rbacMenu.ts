import { GATE_APP } from '@fa-admin-pages/configs';
import { BaseTreeApi } from '@fa/ui';
import { Rbac } from '@/types';

/** ------------------------------------------ xx 操作接口 ------------------------------------------ */
class RbacMenuApi extends BaseTreeApi<Rbac.RbacMenu, string> {}

export default new RbacMenuApi(GATE_APP.rbac, 'rbacMenu');
