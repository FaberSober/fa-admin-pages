import { GATE_APP } from '@/configs';
import { BaseZeroApi, type Fa } from '@fa/ui';
import type { OnlineUser } from '@features/fa-admin-pages/types';

class OnlineUserApi extends BaseZeroApi {
  page = (params: Fa.BasePageProps): Promise<Fa.Ret<Fa.Page<OnlineUser.Session>>> => this.post('page', params);

  stats = (): Promise<Fa.Ret<OnlineUser.Stats>> => this.get('stats');

  kickout = (id: string, allSessions: boolean): Promise<Fa.Ret<number>> => this.post('kickout', { id, allSessions });
}

export default new OnlineUserApi(GATE_APP.admin, 'onlineUser');
