import { TelemetryClient } from './client';
import type { TelemetryEnvironment } from './types';

export const telemetry = new TelemetryClient();

const telemetryEnvironments: readonly TelemetryEnvironment[] = ['development', 'test', 'staging', 'production'];

/** 初始化 Web 端 Telemetry，并把公共请求上下文同步到应用请求头。 */
export function initializeTelemetry(): void {
  const appKey = import.meta.env.VITE_APP_TELEMETRY_APP_KEY;
  if (!appKey || telemetry.isInitialized()) return;

  const configuredEnvironment = import.meta.env.VITE_APP_TELEMETRY_ENV;
  const environment: TelemetryEnvironment = telemetryEnvironments.includes(configuredEnvironment)
    ? configuredEnvironment
    : import.meta.env.DEV
      ? 'development'
      : 'production';

  telemetry.init({
    appKey,
    clientType: 'WEB',
    environment,
    release: String(window.FaVersionName || 'unknown'),
  });

  const telemetryWindow = window as Window & { faHeader?: Record<string, string> };
  telemetryWindow.faHeader = { ...telemetryWindow.faHeader, ...telemetry.getRequestHeaders() };
}
