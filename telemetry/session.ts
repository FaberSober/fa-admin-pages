export function createTelemetrySessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `telemetry-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
