import { sendMessage, useWsStore } from '@features/fa-admin-pages/layout/websocket';
import type { RemoteClient } from '@features/fa-admin-pages/types';
import { ReadyState } from 'ahooks/lib/useWebSocket';
import { useEffect, useRef, useState } from 'react';
import useBus from 'use-bus';
import { canResumeCapture, type ConnectionSample, type ConnectionSnapshot, getConnectionState } from './connectionStatus';

type Phase = 'idle' | 'waiting' | 'starting' | 'active';
const createRequestId = () => crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16)).join('-');
const terminalReasons: Record<string, string> = {
  timeout: '采集已超时，请手动重新开启',
  ack_timeout: '客户端未确认开启采集，请检查连接并更新 App',
  permission_lost: '采集权限已失效',
  replaced: '采集会话已被替换',
  service_unavailable: '采集服务暂时不可用，请稍后重试',
};

export default function useRemoteLogCapture(client: RemoteClient.Client, onEntry: (event: RemoteClient.LogEvent) => void, onMarker: (text: string) => void) {
  const socketReady = useWsStore((state) => state.readyState) === ReadyState.Open;
  const [phase, setPhase] = useState<Phase>('idle');
  const phaseRef = useRef<Phase>('idle');
  const [wanted, setWanted] = useState(false);
  const wantedRef = useRef(false);
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now);
  const [samples, setSamples] = useState<ConnectionSample[]>([]);
  const [snapshot, setSnapshot] = useState<ConnectionSnapshot>({ state: 'unknown', receivedAt: 0 });
  const snapshotRef = useRef(snapshot);
  const heartbeatRef = useRef(false);
  const rawHeartbeatRef = useRef<number>();
  const [watchId] = useState(createRequestId);
  const requestIdRef = useRef<string>();
  const sessionIdRef = useRef<string>();
  const captureClientRef = useRef<string>();
  const requestTimeRef = useRef(0);
  const serverDeadlineRef = useRef<number>();
  const localDeadlineRef = useRef<number>();
  const retryAfterRef = useRef(0);
  const callbacksRef = useRef({ onEntry, onMarker });
  callbacksRef.current = { onEntry, onMarker };
  const state = getConnectionState(snapshot, socketReady, now);

  const updatePhase = (value: Phase) => {
    phaseRef.current = value;
    setPhase(value);
  };

  const updateWanted = (value: boolean) => {
    wantedRef.current = value;
    setWanted(value);
  };

  const stopRequest = () => {
    if (requestIdRef.current && useWsStore.getState().readyState === ReadyState.Open) {
      sendMessage({ type: 'RemoteLog', data: { action: 'stop', requestId: requestIdRef.current, sessionId: sessionIdRef.current } });
    }
  };

  const waitForRecovery = (text: string) => {
    stopRequest();
    requestIdRef.current = undefined;
    sessionIdRef.current = undefined;
    captureClientRef.current = undefined;
    retryAfterRef.current = Date.now() + 1000;
    updatePhase(wantedRef.current ? 'waiting' : 'idle');
    setNotice(text);
    if (wantedRef.current) callbacksRef.current.onMarker(text);
  };

  useBus(
    ['@@ws/RECEIVE/RemoteClientStatus'],
    ({ payload }) => {
      const event = payload as RemoteClient.StatusEvent | undefined;
      if (!event || event.watchId !== watchId) return;
      const receivedAt = Date.now();
      if (event.action === 'error') {
        stopRequest();
        updateWanted(false);
        updatePhase('idle');
        setNotice(event.message || '无法订阅客户端状态');
      }
      const lastSeenAt = event.lastSeenAt === undefined ? undefined : receivedAt - Math.max(0, event.serverTime - event.lastSeenAt);
      const next = { state: event.state, receivedAt, lastSeenAt, clientId: event.clientId };
      heartbeatRef.current ||= event.state === 'online' && event.lastSeenAt !== undefined && event.lastSeenAt !== rawHeartbeatRef.current;
      rawHeartbeatRef.current = event.lastSeenAt;
      snapshotRef.current = next;
      setSnapshot(next);
      setNow(receivedAt);
    },
    [watchId],
  );

  useBus(
    ['@@ws/RECEIVE/RemoteLog'],
    ({ payload }) => {
      const event = payload as RemoteClient.LogEvent | undefined;
      if (!event || !requestIdRef.current || event.requestId !== requestIdRef.current) return;
      if (event.clientId && event.clientId !== captureClientRef.current) return;
      if (event.action === 'starting' || event.action === 'started') {
        if (!event.sessionId) return;
        sessionIdRef.current = event.sessionId;
        if (!wantedRef.current) {
          stopRequest();
          return;
        }
        if (event.expiresAt && event.serverTime) {
          serverDeadlineRef.current = event.expiresAt;
          localDeadlineRef.current = Math.min(
            localDeadlineRef.current ?? Number.POSITIVE_INFINITY,
            Date.now() + Math.max(0, event.expiresAt - event.serverTime),
          );
        }
        const wasActive = phaseRef.current === 'active';
        updatePhase(event.action === 'started' ? 'active' : 'starting');
        setNotice(event.action === 'started' ? '客户端已确认采集' : '等待客户端开启回执…');
        if (event.action === 'started' && !wasActive) callbacksRef.current.onMarker('客户端已确认，日志采集已开启');
      } else if (event.action === 'entry' && wantedRef.current && phaseRef.current === 'active' && event.sessionId === sessionIdRef.current) {
        callbacksRef.current.onEntry(event);
      } else if (event.action === 'ended') {
        if (event.sessionId !== sessionIdRef.current) return;
        if (event.reason === 'connection_closed' || event.reason === 'admin_disconnected') {
          waitForRecovery('客户端连接已中断，等待恢复采集');
        } else {
          updateWanted(false);
          requestIdRef.current = undefined;
          sessionIdRef.current = undefined;
          updatePhase('idle');
          const text = terminalReasons[event.reason || ''] || '采集已结束';
          setNotice(text);
          callbacksRef.current.onMarker(text);
        }
      } else if (event.action === 'stopped') {
        requestIdRef.current = undefined;
        sessionIdRef.current = undefined;
        updatePhase(wantedRef.current ? 'waiting' : 'idle');
        setNotice(wantedRef.current ? '等待恢复采集' : '采集已停止');
      } else if (event.action === 'error') {
        if (event.message === '客户端已离线') waitForRecovery('客户端已离线，等待恢复采集');
        else {
          stopRequest();
          requestIdRef.current = undefined;
          sessionIdRef.current = undefined;
          updateWanted(false);
          updatePhase('idle');
          setNotice(event.message || '无法开启远程采集');
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!socketReady) {
      snapshotRef.current = { state: 'unknown', receivedAt: 0 };
      setSnapshot(snapshotRef.current);
      if (wantedRef.current) waitForRecovery('管理端连接已断开，等待恢复采集');
      else {
        requestIdRef.current = undefined;
        sessionIdRef.current = undefined;
        updatePhase('idle');
      }
      return;
    }
    sendMessage({
      type: 'RemoteClientStatus',
      data: { action: 'watch', watchId, userId: client.userId, clientInstanceId: client.clientInstanceId || client.id },
    });
    return () => {
      if (useWsStore.getState().readyState === ReadyState.Open) sendMessage({ type: 'RemoteClientStatus', data: { action: 'unwatch', watchId } });
    };
  }, [socketReady, watchId, client.userId, client.clientInstanceId, client.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      const timestamp = Date.now();
      const current = snapshotRef.current;
      const sample: ConnectionSample = {
        timestamp,
        state: getConnectionState(current, useWsStore.getState().readyState === ReadyState.Open, timestamp),
        heartbeat: heartbeatRef.current,
        lastSeenAt: current.lastSeenAt,
        clientId: current.clientId,
      };
      heartbeatRef.current = false;
      setNow(timestamp);
      setSamples((previous) => [...previous.filter((item) => item.timestamp > timestamp - 180_000), sample].slice(-180));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!wanted) return;
    if (localDeadlineRef.current !== undefined && now >= localDeadlineRef.current) {
      stopRequest();
      updateWanted(false);
      requestIdRef.current = undefined;
      sessionIdRef.current = undefined;
      updatePhase('idle');
      setNotice(terminalReasons.timeout);
      callbacksRef.current.onMarker(terminalReasons.timeout);
      return;
    }
    if (phase === 'starting' && now - requestTimeRef.current > 25_000) {
      stopRequest();
      updateWanted(false);
      requestIdRef.current = undefined;
      updatePhase('idle');
      setNotice(terminalReasons.ack_timeout);
      return;
    }
    if ((phase === 'active' || phase === 'starting') && (!canResumeCapture(true, state, snapshot.clientId) || snapshot.clientId !== captureClientRef.current)) {
      waitForRecovery(state === 'unknown' ? '状态暂时未知，等待连接恢复' : '客户端连接已变化，等待恢复采集');
      return;
    }
    if (phase !== 'waiting' || now < retryAfterRef.current || !canResumeCapture(wanted, state, snapshot.clientId, localDeadlineRef.current, now)) return;
    const requestId = createRequestId();
    requestIdRef.current = requestId;
    captureClientRef.current = snapshot.clientId;
    requestTimeRef.current = Date.now();
    updatePhase('starting');
    setNotice('正在申请采集…');
    sendMessage({ type: 'RemoteLog', data: { action: 'start', clientId: snapshot.clientId, requestId, expiresAt: serverDeadlineRef.current } });
  }, [wanted, phase, state, snapshot.clientId, now]);

  useEffect(
    () => () => {
      wantedRef.current = false;
      stopRequest();
    },
    [],
  );

  const startCapture = () => {
    serverDeadlineRef.current = undefined;
    localDeadlineRef.current = Date.now() + 30 * 60_000;
    retryAfterRef.current = 0;
    updateWanted(true);
    updatePhase('waiting');
    setNotice('等待客户端在线并确认采集');
  };

  const stopCapture = () => {
    updateWanted(false);
    stopRequest();
    requestIdRef.current = undefined;
    sessionIdRef.current = undefined;
    updatePhase('idle');
    setNotice('采集已停止');
    callbacksRef.current.onMarker('已手动停止采集');
  };

  return { phase, wanted, notice, socketReady, state, samples, now, lastSeenAt: snapshot.lastSeenAt, startCapture, stopCapture };
}
