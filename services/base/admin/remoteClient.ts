import { BaseZeroApi, type Fa } from '@fa/ui';
import type { RemoteClient } from '@features/fa-admin-pages/types';
import { GATE_APP } from '@/configs';

class RemoteClientApi extends BaseZeroApi {
  page = (params: Fa.BasePageProps): Promise<Fa.Ret<Fa.Page<RemoteClient.Client>>> => this.post('page', params);
}

export default new RemoteClientApi(GATE_APP.admin, 'remoteClient');
