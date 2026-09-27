import { GATE_APP } from '@/configs';
import { BaseApi, type Fa } from '@fa/ui';
import type { Tn } from '@/types';

class TenantUserApi extends BaseApi<Tn.TenantUser, string> {
  myTenants = () => this.get<Tn.TenantUser[]>('myTenants', undefined, { headers: { hideErrorMsg: '1' } });

  saveMyTenantOrder = (tenantIds: string[]): Promise<Fa.Ret<Tn.TenantUser[]>> => this.post('myOrder', { tenantIds });
}

export default new TenantUserApi(GATE_APP.tn, 'tenantUser');
