import { BaseZeroApi, type Fa } from '@fa/ui';
import { GATE_APP } from '@/configs';

class TenantPermissionApi extends BaseZeroApi {
  getMenuIds = (tenantId: string): Promise<Fa.Ret<number[]>> => this.get(`getMenuIds/${tenantId}`);
}

export default new TenantPermissionApi(GATE_APP.tn, 'tenantPermission');
