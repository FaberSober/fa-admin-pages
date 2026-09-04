import { GATE_APP } from '@/configs';
import { BaseZeroApi, type Fa } from '@fa/ui';
import type { Admin } from '@/types';

class TelemetryDashboardApi extends BaseZeroApi {
  overview = (): Promise<Fa.Ret<Admin.TelemetryDashboardOverview>> => this.get('overview');
  trend = (days: 7 | 30): Promise<Fa.Ret<Admin.TelemetryDashboardTrend[]>> => this.get(`trend?days=${days}`);
  moduleRank = (): Promise<Fa.Ret<Admin.TelemetryDashboardRank[]>> => this.get('moduleRank');
  eventRank = (): Promise<Fa.Ret<Admin.TelemetryDashboardRank[]>> => this.get('eventRank');
}

export default new TelemetryDashboardApi(GATE_APP.telemetry, 'dashboard');
