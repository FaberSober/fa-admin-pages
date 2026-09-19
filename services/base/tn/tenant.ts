import { BaseApi, type Fa } from '@fa/ui';
import { GATE_APP } from '@/configs';
import type { Tn } from '@/types';

class TenantApi extends BaseApi<Tn.Tenant, string> {
  createWithPermissions = (params: Tn.TenantWithPermissionsReq): Promise<Fa.Ret<Tn.Tenant>> => this.post('createWithPermissions', params);

  updateWithPermissions = (params: Tn.TenantWithPermissionsReq): Promise<Fa.Ret<Tn.Tenant>> => this.post('updateWithPermissions', params);
}

export default new TenantApi(GATE_APP.tn, 'tenant');
