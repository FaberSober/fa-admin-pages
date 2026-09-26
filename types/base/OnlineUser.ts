namespace OnlineUser {
  /** 按用户聚合的当前在线客户端数量。 */
  export interface PresenceSummary {
    userId: string;
    username: string;
    name: string | null;
    webCount: number | string;
    appCount: number | string;
    desktopCount: number | string;
    deviceCount: number | string;
    lastSeenAt: number | string;
  }

  /** 在线设备展示信息；服务端不会返回设备实例 ID 或连接 ID。 */
  export interface PresenceDevice {
    clientType: 'WEB' | 'MOBILE' | 'DESKTOP';
    appCode: string | null;
    appName: string | null;
    release: string | null;
    environment: string | null;
    platform: string | null;
    osName: string | null;
    osVersion: string | null;
    deviceModel: string | null;
    connectedAt: number | string;
    lastSeenAt: number | string;
  }

  /** Unix 毫秒时间；旧会话的登录时间可能未知。 */
  export interface Session {
    id: string;
    userId: string;
    username: string;
    name: string;
    source: 'web';
    loginTime: number | null;
    lastAccessTime: number;
    ip: string | null;
    browser: string;
    os: string;
    expiresAt: number | null;
    active: boolean;
    current: boolean;
    currentUser: boolean;
  }

  export interface Stats {
    sessionCount: number;
    userCount: number;
    activeUserCount: number;
    activeWindowSeconds: number;
  }
}

export default OnlineUser;
