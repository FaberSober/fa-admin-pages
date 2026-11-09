import { Empty, Tag, Typography, theme } from 'antd';
import type { Admin } from '@/types';
import { buildExecutionSlices, executionStates } from './flowExecutionTimeline';
import './job-flow-execution-timeline.scss';

const stateColor = (status: number) => status === 40 ? 'success' : status === 50 ? 'error' : status === 60 || status === 80 ? 'warning' : status === 20 || status === 30 ? 'processing' : 'default';

export default function JobFlowExecutionTimeline({ run, selectedNodeId, onSelect }: {
  run: Admin.JobFlowRun; selectedNodeId?: string; onSelect: (id: string) => void;
}) {
  const { token } = theme.useToken();
  const slices = buildExecutionSlices(run.nodes);
  return <div className="job-flow-time-slices">
    <Typography.Text type="secondary" className="job-flow-time-caption">每个节点一张卡片，按开始登记排序；区间条使用同一时间刻度，耗时包含启动排队。</Typography.Text>
    {!slices.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无节点记录" />}
    <div className="job-flow-time-axis">
      {slices.map(({ node, index, begin, duration, offset, width }) => {
        const color = node.status === 40 ? token.colorSuccess : node.status === 50 ? token.colorError : node.status === 60 || node.status === 80 ? token.colorWarning : node.status === 20 || node.status === 30 ? token.colorPrimary : token.colorTextSecondary;
        const endLabel = duration !== undefined ? node.endTime : node.status === 80 ? '结果未确认' : node.status === 20 || node.status === 30 ? '执行中' : '未记录';
        return <div className="job-flow-time-item" key={node.id}>
          <span className="job-flow-time-dot" style={{ background: color }} />
          <button type="button" className={`job-flow-time-card${selectedNodeId === node.nodeId ? ' is-selected' : ''}`} style={{ borderLeftColor: color }} onClick={() => onSelect(node.nodeId)} aria-label={`查看节点 ${index + 1} ${node.nodeName}`}>
            <div className="job-flow-time-heading"><span className="job-flow-time-number">{String(index + 1).padStart(2, '0')}</span><strong>{node.nodeName}</strong><Tag color={stateColor(node.status)}>{executionStates[node.status] ?? '未知状态'}</Tag></div>
            <div className="job-flow-time-range"><div><small>开始登记</small><span>{begin === undefined ? '未记录' : node.beginTime}</span></div><div><small>结束</small><span>{endLabel}</span></div></div>
            <div className="job-flow-time-track" title="所有节点采用同一相对时间刻度；未确认结束只显示开始位置">
              {offset !== undefined && <span style={{ left: `min(calc(100% - 4px), ${offset}%)`, width: width === undefined ? 4 : `max(4px, ${width}%)`, background: color }} />}
            </div>
            <div className="job-flow-time-foot"><span>{duration === undefined ? '暂无确定耗时' : `耗时 ${duration < 1000 ? `${duration} ms` : `${Number((duration / 1000).toFixed(2))} s`}`}</span><span>查看详情 →</span></div>
            {node.reason && <div className="job-flow-time-reason">{node.reason}</div>}
          </button>
        </div>;
      })}
    </div>
  </div>;
}
