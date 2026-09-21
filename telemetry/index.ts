export { initializeTelemetry, telemetry } from './bootstrap';
export { TelemetryErrorBoundary } from './error-boundary';
export { TelemetryPageTracker, TelemetryProvider } from './provider';

export type {
  TelemetryBasePayload,
  TelemetryBreadcrumb,
  TelemetryClientType,
  TelemetryContext,
  TelemetryDesktopContext,
  TelemetryEnvironment,
  TelemetryErrorPayload,
  TelemetryEventPayload,
  TelemetryEventType,
  TelemetryInitOptions,
  TelemetryUser,
} from './types';
