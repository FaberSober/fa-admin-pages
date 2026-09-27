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

  /** 按账号汇总的有效后台 Web 登录会话。 */
  export interface SessionUserSummary {
    userId: string;
    username: string;
    name: string | null;
    sessionCount: number | string;
    activeSessionCount: number | string;
    lastAccessTime: number | string;
    currentUser: boolean;
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
    loginTime: number | string | null;
    lastAccessTime: number | string;
    ip: string | null;
    browser: string;
    os: string;
    clientType: string | null;
    clientInstanceId: string | null;
    expiresAt: number | string | null;
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
