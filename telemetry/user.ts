import type { TelemetryUser } from './types';

export class TelemetryUserStore {
  private user: TelemetryUser = {};

  get(): TelemetryUser {
    return { ...this.user };
  }

  set(user: TelemetryUser): void {
    this.user = { ...user };
  }

  clear(): void {
    this.user = {};
  }
}
