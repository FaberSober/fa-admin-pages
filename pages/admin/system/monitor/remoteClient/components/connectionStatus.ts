import type { RemoteClient } from '@features/fa-admin-pages/types';

export interface ConnectionSnapshot {
  state: RemoteClient.ConnectionState;
  clientId?: string;
  lastSeenAt?: number;
  receivedAt: number;
}

export interface ConnectionSample {
  timestamp: number;
  state: RemoteClient.ConnectionState;
  heartbeat: boolean;
  lastSeenAt?: number;
  clientId?: string;
}

export function getConnectionState(snapshot: ConnectionSnapshot, socketReady: boolean, now: number): RemoteClient.ConnectionState {
  if (!socketReady || now - snapshot.receivedAt > 15_000 || snapshot.state === 'unknown') return 'unknown';
  if (snapshot.state === 'offline' || !snapshot.clientId || snapshot.lastSeenAt === undefined) return 'offline';
  const age = now - snapshot.lastSeenAt;
  return age > 60_000 ? 'offline' : age > 40_000 ? 'delayed' : 'online';
}

export function canResumeCapture(wanted: boolean, state: RemoteClient.ConnectionState, clientId?: string, deadline?: number, now = Date.now()) {
  return wanted && (state === 'online' || state === 'delayed') && Boolean(clientId) && (deadline === undefined || now < deadline);
}

export const connectionLabels: Record<RemoteClient.ConnectionState, string> = {
  online: '在线',
  delayed: '心跳延迟',
  offline: '离线',
  unknown: '状态未知',
};
