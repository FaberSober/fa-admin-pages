import { GATE_APP } from '@/configs';
import { BaseZeroApi, type Fa } from '@fa/ui';
import type { Admin } from '@/types';

class TelemetryDashboardApi extends BaseZeroApi {
  overview = (appId: number): Promise<Fa.Ret<Admin.TelemetryDashboardOverview>> => this.get(`overview?appId=${appId}`);
  trend = (appId: number, days: 7 | 30): Promise<Fa.Ret<Admin.TelemetryDashboardTrend[]>> => this.get(`trend?appId=${appId}&days=${days}`);
  moduleRank = (appId: number): Promise<Fa.Ret<Admin.TelemetryDashboardRank[]>> => this.get(`moduleRank?appId=${appId}`);
  eventRank = (appId: number): Promise<Fa.Ret<Admin.TelemetryDashboardRank[]>> => this.get(`eventRank?appId=${appId}`);
  globalOverview = (): Promise<Fa.Ret<Admin.TelemetryGlobalDashboardOverview>> => this.get('globalOverview');
  globalTrend = (days: 7 | 30): Promise<Fa.Ret<Admin.TelemetryDashboardTrend[]>> => this.get(`globalTrend?days=${days}`);
  globalAppRank = (days: 7 | 30): Promise<Fa.Ret<Admin.TelemetryGlobalDashboardAppRank[]>> => this.get(`globalAppRank?days=${days}`);
}

export default new TelemetryDashboardApi(GATE_APP.telemetry, 'dashboard');
