import { BaseZeroApi, type Fa } from '@fa/ui';
import { GATE_APP } from '@/configs';
import type { Tn } from '@/types';

class TenantPermissionApi extends BaseZeroApi {
  getMenuIds = (tenantId: string): Promise<Fa.Ret<number[]>> => this.get(`getMenuIds/${tenantId}`);

  getPermissionScope = (tenantId: string): Promise<Fa.Ret<Tn.TenantPermissionScope>> => this.get(`getPermissionScope/${tenantId}`);
}

export default new TenantPermissionApi(GATE_APP.tn, 'tenantPermission');
