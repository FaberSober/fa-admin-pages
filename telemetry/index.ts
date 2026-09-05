import { TelemetryClient } from './client';

export const telemetry = new TelemetryClient();

export { TelemetryErrorBoundary } from './error-boundary';

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
