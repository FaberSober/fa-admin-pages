import type { RemoteClient } from '@features/fa-admin-pages/types';
import { theme, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { connectionLabels, type ConnectionSample } from './connectionStatus';

interface ClientHeartbeatChartProps {
  samples: ConnectionSample[];
  state: RemoteClient.ConnectionState;
  now: number;
  lastSeenAt?: number;
  socketReady: boolean;
}

export default function ClientHeartbeatChart({ samples, state, now, lastSeenAt, socketReady }: ClientHeartbeatChartProps) {
  const { token } = theme.useToken();
  const colors = { online: token.colorSuccess, delayed: token.colorWarning, offline: token.colorError, unknown: token.colorTextDisabled };
  const windowStart = now - 180_000;
  const x = (time: number) => Math.max(0, Math.min(220, ((time - windowStart) / 180_000) * 220));
  const age = lastSeenAt === undefined ? undefined : Math.max(0, Math.floor((now - lastSeenAt) / 1000));
  const label = socketReady ? connectionLabels[state] : '管理端已断开';

  return (
    <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontWeight: 400 }}>
      <Tooltip title="最近 3 分钟连接状态；脉冲由真实心跳触发。悬停图表可查看采样详情。">
        <svg width="220" height="32" viewBox="0 0 220 32" role="img" aria-label={`客户端心跳图：${label}`}>
          <title>客户端最近 3 分钟心跳与连接状态</title>
          <path d="M0 8H220 M0 16H220 M0 24H220 M55 0V32 M110 0V32 M165 0V32" stroke={token.colorBorderSecondary} strokeWidth="0.5" />
          {samples.map((sample) => {
            const start = x(sample.timestamp - 1000);
            const end = x(sample.timestamp);
            const middle = (start + end) / 2;
            const baseline = sample.state === 'offline' ? 27 : 22;
            const path =
              sample.heartbeat && sample.state === 'online'
                ? `M${start} 22 L${middle - 0.4} 22 L${middle} 5 L${middle + 0.4} 28 L${end} 22`
                : `M${start} ${baseline} L${end} ${baseline}`;
            return (
              <path key={sample.timestamp} d={path} stroke={colors[sample.state]} strokeWidth="1.5" fill="none" strokeLinecap="round">
                <title>{`${dayjs(sample.timestamp).format('HH:mm:ss')} · ${connectionLabels[sample.state]}${sample.heartbeat ? ' · 收到心跳' : ''}${sample.lastSeenAt === undefined ? '' : ` · 心跳 ${Math.max(0, Math.floor((sample.timestamp - sample.lastSeenAt) / 1000))} 秒前`}${sample.clientId ? ` · 连接 ${sample.clientId}` : ''}`}</title>
              </path>
            );
          })}
          <circle cx="217" cy="22" r="2.5" fill={colors[state]} />
        </svg>
      </Tooltip>
      <span style={{ color: colors[state], whiteSpace: 'nowrap' }}>● {label}</span>
      <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
        {age === undefined ? (state === 'unknown' ? '等待状态快照' : '暂无心跳记录') : `最近心跳 ${age} 秒前`}
      </Typography.Text>
    </div>
  );
}
