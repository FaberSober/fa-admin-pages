namespace RemoteClient {
  /** 时间为 Unix 毫秒；客户端类别遵循 Telemetry 的通用类别。 */
  export interface Client {
    id: string;
    clientInstanceId: string | null;
    clientType: 'WEB' | 'DESKTOP' | 'MOBILE' | 'OTHER';
    runtime: string | null;
    appCode: string | null;
    appName: string | null;
    release: string | null;
    environment: string | null;
    platform: string | null;
    osName: string | null;
    osVersion: string | null;
    deviceModel: string | null;
    userId: string | null;
    username: string | null;
    name: string | null;
    connectedAt: number | string;
    lastSeenAt: number | string;
  }

  export interface LogEvent {
    action: 'starting' | 'started' | 'stopped' | 'ended' | 'entry' | 'error';
    requestId?: string;
    clientId?: string;
    sessionId?: string;
    level?: 'DEBUG' | 'LOG' | 'INFO' | 'WARN' | 'ERROR';
    source?: 'console' | 'runtime';
    message?: string;
    timestamp?: number;
    reason?: string;
    expiresAt?: number;
    serverTime?: number;
  }

  export type ConnectionState = 'online' | 'delayed' | 'offline' | 'unknown';

  export interface StatusEvent {
    action: 'status' | 'error';
    watchId: string;
    state: ConnectionState;
    clientId?: string;
    lastSeenAt?: number;
    connectedAt?: number;
    serverTime: number;
    message?: string;
  }
}

export default RemoteClient;
