import { sendMessage, useWsStore } from '@features/fa-admin-pages/layout/websocket';
import type { RemoteClient } from '@features/fa-admin-pages/types';
import { ReadyState } from 'ahooks/lib/useWebSocket';
import { Button, Modal, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import useBus from 'use-bus';

const MAX_VISIBLE_LOGS = 500;

interface LogLine {
  id: number;
  timestamp: number;
  level: NonNullable<RemoteClient.LogEvent['level']>;
  source: NonNullable<RemoteClient.LogEvent['source']>;
  message: string;
}

interface RemoteLogViewerProps {
  client: RemoteClient.Client;
  onClose: () => void;
}

const levelColor: Record<LogLine['level'], string> = {
  DEBUG: 'default',
  LOG: 'default',
  INFO: 'blue',
  WARN: 'orange',
  ERROR: 'red',
};

export default function RemoteLogViewer({ client, onClose }: RemoteLogViewerProps) {
  const readyState = useWsStore((state) => state.readyState);
  const socketReady = readyState === ReadyState.Open;
  const [phase, setPhase] = useState<'idle' | 'starting' | 'active' | 'stopping'>('idle');
  const [notice, setNotice] = useState('');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const requestSentRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef(0);

  useBus(
    ['@@ws/RECEIVE/RemoteLog'],
    ({ payload }) => {
      if (!payload || typeof payload !== 'object') return;
      const event = payload as RemoteClient.LogEvent;
      if (event.clientId && event.clientId !== client.id) return;

      if (event.action === 'started' && event.sessionId) {
        sessionIdRef.current = event.sessionId;
        requestSentRef.current = true;
        setPhase('active');
        setNotice('采集已开启');
      } else if (event.action === 'entry' && event.sessionId === sessionIdRef.current && event.level && event.message !== undefined) {
        const line: LogLine = {
          id: ++sequenceRef.current,
          timestamp: event.timestamp ?? Date.now(),
          level: event.level,
          source: event.source ?? 'console',
          message: event.message,
        };
        setLogs((previous) => [...previous, line].slice(-MAX_VISIBLE_LOGS));
      } else if (event.action === 'stopped' && (!event.sessionId || event.sessionId === sessionIdRef.current)) {
        requestSentRef.current = false;
        sessionIdRef.current = undefined;
        setPhase('idle');
        setNotice('采集已停止');
      } else if (event.action === 'ended' && event.sessionId === sessionIdRef.current) {
        requestSentRef.current = false;
        sessionIdRef.current = undefined;
        setPhase('idle');
        setNotice(event.reason === 'timeout' ? '采集已超时结束' : '客户端连接已结束');
      } else if (event.action === 'error') {
        requestSentRef.current = false;
        sessionIdRef.current = undefined;
        setPhase('idle');
        setNotice(event.message || '无法开启远程采集');
      }
    },
    [client.id],
  );

  useEffect(
    () => () => {
      if (requestSentRef.current && useWsStore.getState().readyState === ReadyState.Open) {
        sendMessage({ type: 'RemoteLog', data: { action: 'stop', sessionId: sessionIdRef.current } });
      }
    },
    [],
  );

  useEffect(() => {
    if (!socketReady && requestSentRef.current) {
      requestSentRef.current = false;
      sessionIdRef.current = undefined;
      setPhase('idle');
      setNotice('管理端 WebSocket 已断开，采集已结束');
    }
  }, [socketReady]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs, autoScroll]);

  const startCapture = () => {
    if (!socketReady) return;
    requestSentRef.current = true;
    setPhase('starting');
    setNotice('正在开启采集…');
    setLogs([]);
    sendMessage({ type: 'RemoteLog', data: { action: 'start', clientId: client.id } });
  };

  const stopCapture = () => {
    if (!requestSentRef.current || !socketReady) return;
    setPhase('stopping');
    setNotice('正在停止采集…');
    sendMessage({ type: 'RemoteLog', data: { action: 'stop', sessionId: sessionIdRef.current } });
  };

  const close = () => {
    if (requestSentRef.current && socketReady) {
      sendMessage({ type: 'RemoteLog', data: { action: 'stop', sessionId: sessionIdRef.current } });
    }
    requestSentRef.current = false;
    onClose();
  };

  return (
    <Modal title={`实时日志 · ${client.appName || client.clientType} · ${client.username || '-'}`} open width={1_000} footer={null} onCancel={close}>
      <Space wrap>
        <output aria-atomic="true">
          {phase === 'active' ? '采集中' : phase === 'starting' ? '正在连接' : phase === 'stopping' ? '正在停止' : '未采集'}
          {notice ? ` · ${notice}` : ''}
        </output>
        <Button type="primary" disabled={!socketReady || phase !== 'idle'} onClick={startCapture}>
          开始采集
        </Button>
        <Button danger disabled={!socketReady || (phase !== 'active' && phase !== 'starting')} onClick={stopCapture}>
          停止采集
        </Button>
        <Button disabled={!logs.length} onClick={() => setLogs([])}>
          清空
        </Button>
        <Button type={autoScroll ? 'primary' : 'default'} onClick={() => setAutoScroll((value) => !value)}>
          自动滚动{autoScroll ? '：开' : '：关'}
        </Button>
        <Typography.Text type="secondary">
          保留最近 {logs.length} / {MAX_VISIBLE_LOGS} 条
        </Typography.Text>
      </Space>
      <div
        ref={scrollRef}
        role="log"
        aria-label="远程客户端日志"
        aria-live="off"
        style={{ height: '60vh', minHeight: 280, maxHeight: 560, overflow: 'auto', marginTop: 12, padding: 12 }}
      >
        {logs.length ? (
          logs.map((line) => (
            <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '92px 76px 54px minmax(0, 1fr)', gap: 8, alignItems: 'start', marginBottom: 4 }}>
              <Typography.Text type="secondary">{dayjs(line.timestamp).format('HH:mm:ss.SSS')}</Typography.Text>
              <Tag color={levelColor[line.level]}>{line.level}</Tag>
              <Typography.Text type="secondary">{line.source === 'runtime' ? '运行时' : 'Console'}</Typography.Text>
              <code style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{line.message}</code>
            </div>
          ))
        ) : (
          <Typography.Text type="secondary">暂无日志</Typography.Text>
        )}
      </div>
    </Modal>
  );
}
