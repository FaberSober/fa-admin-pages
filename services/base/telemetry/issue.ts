import { GATE_APP } from '@/configs';
import { BaseApi, type Fa } from '@fa/ui';
import type { Admin } from '@/types';

class TelemetryIssueApi extends BaseApi<Admin.ClientErrorIssue, number> {
  updateStatus = (id: number, status: Admin.TelemetryIssueStatus): Promise<Fa.Ret> =>
    this.post(`status/${id}?status=${status}`);
}

export default new TelemetryIssueApi(GATE_APP.telemetry, 'issue');
