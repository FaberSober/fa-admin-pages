import { FaFullContentModal, FaJsonView } from '@fa/ui';
import { sendMessage, useWsStore } from '@features/fa-admin-pages/layout/websocket';
import type { RemoteClient } from '@features/fa-admin-pages/types';
import { ReadyState } from 'ahooks/lib/useWebSocket';
import { Button, Input, Select, Space, Switch, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import useBus from 'use-bus';

const MAX_VISIBLE_LOGS = 500;
const LOG_LEVELS = ['DEBUG', 'LOG', 'INFO', 'WARN', 'ERROR'] as const;

interface LogLine {
  id: number;
  timestamp: number;
  level: NonNullable<RemoteClient.LogEvent['level']>;
  source: NonNullable<RemoteClient.LogEvent['source']>;
  message: string;
  http?: { title: string; data: unknown };
  showHttpJson?: boolean;
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

function parseHttpLog(message: string): LogLine['http'] {
  try {
    const args = JSON.parse(message) as unknown;
    if (!Array.isArray(args) || args.length !== 1 || typeof args[0] !== 'string') return undefined;

    const match = args[0].match(/^\[FaMobile HTTP #(\d+)\] (request|response|failure) 1\/1 (.+)$/);
    if (!match) return undefined;
    return { title: `HTTP #${match[1]} · ${match[2]}`, data: JSON.parse(match[3]) };
  } catch {
    return undefined;
  }
}

export default function RemoteLogViewer({ client, onClose }: RemoteLogViewerProps) {
  const readyState = useWsStore((state) => state.readyState);
  const socketReady = readyState === ReadyState.Open;
  const [phase, setPhase] = useState<'idle' | 'starting' | 'active' | 'stopping'>('idle');
  const [notice, setNotice] = useState('');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<LogLine['level'][]>([]);
  const [searchText, setSearchText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showHttpJson, setShowHttpJson] = useState(true);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const requestSentRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef(0);
  const filteredLogs = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return logs.filter((line) => {
      if (selectedLevels.length && !selectedLevels.includes(line.level)) return false;
      if (!keyword) return true;
      const source = line.source === 'runtime' ? '运行时' : 'Console';
      return `${line.level} ${source} ${line.http?.title ?? ''} ${line.message}`.toLowerCase().includes(keyword);
    });
  }, [logs, searchText, selectedLevels]);

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
        const http = parseHttpLog(event.message);
        const line: LogLine = {
          id: ++sequenceRef.current,
          timestamp: event.timestamp ?? Date.now(),
          level: event.level,
          source: event.source ?? 'console',
          message: event.message,
          http,
          showHttpJson: http ? showHttpJson : undefined,
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
    [client.id, showHttpJson],
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
  }, [filteredLogs, autoScroll, showHttpJson]);

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
    <FaFullContentModal
      title={`实时日志 · ${client.appName || client.clientType} · ${client.username || '-'}`}
      open
      showOk={false}
      showCancel={false}
      onCancel={close}
    >
      <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Space wrap style={{ flex: '0 0 auto' }}>
          <output aria-atomic="true">
            {phase === 'active' ? '采集中' : phase === 'starting' ? '正在连接' : phase === 'stopping' ? '正在停止' : '未采集'}
            {notice ? ` · ${notice}` : ''}
          </output>
          <Space size={4}>
            <Typography.Text>采集</Typography.Text>
            <Switch
              size="small"
              aria-label="远程日志采集"
              checked={phase === 'active' || phase === 'starting'}
              disabled={!socketReady || phase === 'starting' || phase === 'stopping'}
              onChange={(checked) => (checked ? startCapture() : stopCapture())}
            />
          </Space>
          <Space size={4}>
            <Typography.Text>自动滚动：{autoScroll ? '开' : '关'}</Typography.Text>
            <Switch size="small" aria-label="自动滚动" checked={autoScroll} onChange={setAutoScroll} />
          </Space>
          <Space size={4}>
            <Typography.Text>HTTP：{showHttpJson ? 'JSON' : '原文'}</Typography.Text>
            <Switch
              size="small"
              aria-label="全局 HTTP 日志显示格式"
              checked={showHttpJson}
              onChange={(checked) => {
                setShowHttpJson(checked);
                setLogs((previous) => previous.map((line) => (line.http ? { ...line, showHttpJson: checked } : line)));
              }}
            />
          </Space>
          <Select
            mode="multiple"
            allowClear
            maxTagCount={1}
            aria-label="按日志级别筛选"
            placeholder="全部级别"
            value={selectedLevels}
            options={LOG_LEVELS.map((level) => ({ label: level, value: level }))}
            onChange={(levels) => setSelectedLevels(levels as LogLine['level'][])}
            style={{ width: 180 }}
          />
          <Input
            allowClear
            aria-label="搜索日志"
            placeholder="搜索日志内容"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ width: 220 }}
          />
          <Typography.Text type="secondary">
            保留最近 {logs.length} / {MAX_VISIBLE_LOGS} 条 · 匹配 {filteredLogs.length} 条
          </Typography.Text>
          <Button type="text" size="small" disabled={!logs.length} onClick={() => setLogs([])}>
            清空
          </Button>
        </Space>
        <div
          ref={scrollRef}
          role="log"
          aria-label="远程客户端日志"
          aria-live="off"
          style={{ flex: '1 1 0', minHeight: 0, overflow: 'auto', marginTop: 12, padding: 12 }}
        >
          {filteredLogs.length ? (
            filteredLogs.map((line) => (
              <div
                key={line.id}
                style={{ display: 'grid', gridTemplateColumns: '92px 76px 54px minmax(0, 1fr)', gap: 8, alignItems: 'start', marginBottom: 4 }}
              >
                <Typography.Text type="secondary">{dayjs(line.timestamp).format('HH:mm:ss.SSS')}</Typography.Text>
                <Tag color={levelColor[line.level]}>{line.level}</Tag>
                <Typography.Text type="secondary">{line.source === 'runtime' ? '运行时' : 'Console'}</Typography.Text>
                {line.http ? (
                  <div style={{ minWidth: 0 }}>
                    <Space size={6}>
                      <Typography.Text type="secondary">{line.http.title}</Typography.Text>
                      <Typography.Text type="secondary">{(line.showHttpJson ?? true) ? 'JSON' : '原文'}</Typography.Text>
                      <Switch
                        size="small"
                        aria-label={`切换 ${line.http.title} 的原文或 JSON`}
                        checked={line.showHttpJson ?? true}
                        onChange={(checked) => {
                          setLogs((previous) => previous.map((item) => (item.id === line.id ? { ...item, showHttpJson: checked } : item)));
                        }}
                      />
                    </Space>
                    {(line.showHttpJson ?? true) ? (
                      <FaJsonView data={line.http.data} defaultExpandDepth={2} maxHeight={320} />
                    ) : (
                      <code style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{line.message}</code>
                    )}
                  </div>
                ) : (
                  <code style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{line.message}</code>
                )}
              </div>
            ))
          ) : (
            <Typography.Text type="secondary">{logs.length ? '没有匹配的日志' : '暂无日志'}</Typography.Text>
          )}
        </div>
      </div>
    </FaFullContentModal>
  );
}
