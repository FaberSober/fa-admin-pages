import { BaseZeroApi, type Fa } from '@fa/ui';
import type { OnlineUser } from '@features/fa-admin-pages/types';
import { GATE_APP } from '@/configs';

class OnlineUserApi extends BaseZeroApi {
  page = (params: Fa.BasePageProps): Promise<Fa.Ret<Fa.Page<OnlineUser.Session>>> => this.post('page', params);

  presencePage = (params: Fa.BasePageProps): Promise<Fa.Ret<Fa.Page<OnlineUser.PresenceSummary>>> => this.post('presence/page', params);

  presenceDevices = (userId: string): Promise<Fa.Ret<OnlineUser.PresenceDevice[]>> => this.get(`presence/${encodeURIComponent(userId)}/devices`);

  stats = (): Promise<Fa.Ret<OnlineUser.Stats>> => this.get('stats');

  kickout = (id: string, allSessions: boolean): Promise<Fa.Ret<number>> => this.post('kickout', { id, allSessions });

  kickoutUser = (userId: string): Promise<Fa.Ret<number>> => this.post('kickoutUser', { userId });
}

export default new OnlineUserApi(GATE_APP.admin, 'onlineUser');
