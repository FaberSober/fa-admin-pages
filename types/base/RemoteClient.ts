namespace RemoteClient {
  /** 时间为 Unix 毫秒；客户端类别遵循 Telemetry 的通用类别。 */
  export interface Client {
    id: string;
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
    connectedAt: number;
    lastSeenAt: number;
  }

  export interface LogEvent {
    action: 'started' | 'stopped' | 'ended' | 'entry' | 'error';
    clientId?: string;
    sessionId?: string;
    level?: 'DEBUG' | 'LOG' | 'INFO' | 'WARN' | 'ERROR';
    source?: 'console' | 'runtime';
    message?: string;
    timestamp?: number;
    reason?: string;
  }
}

export default RemoteClient;
