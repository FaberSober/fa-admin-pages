import { GATE_APP } from '@/configs';
import { BaseApi, type Fa } from '@fa/ui';
import type { Admin } from '@/types';

class TelemetryErrorEventApi extends BaseApi<Admin.ClientErrorEvent, number> {
  recentByIssue = (issueId: number): Promise<Fa.Ret<Admin.ClientErrorEvent[]>> => this.get(`recentByIssue/${issueId}`);
}

export default new TelemetryErrorEventApi(GATE_APP.telemetry, 'errorEvent');
