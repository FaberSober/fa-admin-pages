namespace OnlineUser {
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
