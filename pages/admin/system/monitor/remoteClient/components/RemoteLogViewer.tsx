import { FaFullContentModal, FaJsonView } from '@fa/ui';
import type { RemoteClient } from '@features/fa-admin-pages/types';
import { Button, Input, Select, Space, Switch, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ClientHeartbeatChart from './ClientHeartbeatChart';
import useRemoteLogCapture from './useRemoteLogCapture';

const MAX_VISIBLE_LOGS = 500;
const LOG_LEVELS = ['DEBUG', 'LOG', 'INFO', 'WARN', 'ERROR'] as const;
const SOURCE_LOCATION_SUFFIX = /\s+at\s+[^\s]+:\d+(?::\d+)?$/;

interface LogLine {
  id: number;
  timestamp: number;
  level: NonNullable<RemoteClient.LogEvent['level']>;
  source: NonNullable<RemoteClient.LogEvent['source']> | 'system';
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
  let text: string | undefined;
  for (const candidate of [message, message.replace(SOURCE_LOCATION_SUFFIX, '')]) {
    try {
      const args = JSON.parse(candidate) as unknown;
      if (Array.isArray(args) && args.length === 1 && typeof args[0] === 'string') {
        text = args[0].replace(SOURCE_LOCATION_SUFFIX, '');
        break;
      }
    } catch {
      // Some runtimes append the source location outside the serialized Console arguments.
    }
  }

  text ??= message.startsWith('[FaMobile HTTP #') ? message.replace(SOURCE_LOCATION_SUFFIX, '') : undefined;
  const match = text?.match(/^\[FaMobile HTTP #(\d+)\] (request|response|failure) 1\/1 (.+)$/);
  if (!match) return undefined;
  try {
    const data = JSON.parse(match[3]) as unknown;
    return data !== null && typeof data === 'object' && !Array.isArray(data) ? { title: `HTTP #${match[1]} · ${match[2]}`, data } : undefined;
  } catch {
    return undefined;
  }
}

export default function RemoteLogViewer({ client, onClose }: RemoteLogViewerProps) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<LogLine['level'][]>([]);
  const [searchText, setSearchText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showHttpJson, setShowHttpJson] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef(0);
  const filteredLogs = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return logs.filter((line) => {
      if (selectedLevels.length && !selectedLevels.includes(line.level)) return false;
      if (!keyword) return true;
      const source = line.source === 'system' ? '连接' : line.source === 'runtime' ? '运行时' : 'Console';
      return `${line.level} ${source} ${line.http?.title ?? ''} ${line.message}`.toLowerCase().includes(keyword);
    });
  }, [logs, searchText, selectedLevels]);

  const onEntry = useCallback(
    (event: RemoteClient.LogEvent) => {
      if (event.level && event.message !== undefined) {
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
      }
    },
    [showHttpJson],
  );

  const onMarker = useCallback((message: string) => {
    const line: LogLine = { id: ++sequenceRef.current, timestamp: Date.now(), level: 'INFO', source: 'system', message };
    setLogs((previous) => [...previous, line].slice(-MAX_VISIBLE_LOGS));
  }, []);
  const capture = useRemoteLogCapture(client, onEntry, onMarker);
  const { phase, wanted, notice, socketReady } = capture;

  useEffect(() => {
    if (autoScroll && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [filteredLogs, autoScroll, showHttpJson]);

  const startCapture = () => {
    setLogs([]);
    capture.startCapture();
  };

  const close = () => {
    capture.stopCapture();
    onClose();
  };

  return (
    <FaFullContentModal
      title={
        <Space size={20} wrap>
          <span>{`实时日志 · ${client.appName || client.clientType} · ${client.username || '-'}`}</span>
          <ClientHeartbeatChart samples={capture.samples} state={capture.state} now={capture.now} lastSeenAt={capture.lastSeenAt} socketReady={socketReady} />
        </Space>
      }
      open
      showOk={false}
      showCancel={false}
      onCancel={close}
    >
      <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Space wrap style={{ flex: '0 0 auto' }}>
          <output aria-atomic="true">
            {phase === 'active' ? '采集中' : phase === 'starting' ? '正在连接' : phase === 'waiting' ? '等待恢复' : '未采集'}
            {notice ? ` · ${notice}` : ''}
          </output>
          <Space size={4}>
            <Typography.Text>采集</Typography.Text>
            <Switch
              size="small"
              aria-label="远程日志采集"
              checked={wanted}
              disabled={!socketReady && !wanted}
              onChange={(checked) => (checked ? startCapture() : capture.stopCapture())}
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
                <Typography.Text type="secondary">{line.source === 'system' ? '连接' : line.source === 'runtime' ? '运行时' : 'Console'}</Typography.Text>
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
