import { useEffect, useRef, type ReactNode } from 'react';
import { formatJobDuration } from '../jobStatistics';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Empty, Popover, Tag, theme } from 'antd';
import type { Admin } from '@/types';
import { buildExecutionSlices, executionStates, parseExecutionTime } from './flowExecutionTimeline';
import './job-flow-execution-timeline.scss';

const stateColor = (status: number) => status === 40 ? 'success' : status === 50 ? 'error' : status === 60 || status === 80 ? 'warning' : status === 20 || status === 30 ? 'processing' : 'default';

export default function JobFlowExecutionTimeline({ run, selectedNodeId, onSelect, renderLog }: {
  run: Admin.JobFlowRun; selectedNodeId?: string; onSelect: (id: string) => void; renderLog: (node: Admin.JobFlowNodeRun) => ReactNode;
}) {
  const { token } = theme.useToken();
  const cards = useRef(new Map<string, HTMLElement>());
  useEffect(() => {
    if (selectedNodeId) cards.current.get(selectedNodeId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedNodeId]);
  const slices = buildExecutionSlices(run.nodes);
  return <div className="job-flow-time-slices">
    {!slices.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无节点记录" />}
    <div className="job-flow-time-axis">
      {slices.map(({ node, index, begin, duration, offset, width }) => {
        const color = node.status === 40 ? token.colorSuccess : node.status === 50 ? token.colorError : node.status === 60 || node.status === 80 ? token.colorWarning : node.status === 20 || node.status === 30 ? token.colorPrimary : token.colorTextSecondary;
        const endLabel = duration !== undefined ? node.endTime : node.status === 80 ? '结果未确认' : node.status === 20 || node.status === 30 ? '执行中' : '未记录';
        const beginLabel = begin === undefined ? (node.status === 0 || node.status === 10 ? '未启动' : '未记录') : node.beginTime;
        const date = begin === undefined ? undefined : node.beginTime?.slice(0, 10);
        const compactTime = (value?: string) => parseExecutionTime(value) === undefined ? value : value?.slice(11);
        const endDate = duration === undefined ? undefined : node.endTime?.slice(0, 10);
        const elapsedDays = date && endDate ? Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000) : 0;
        const durationLabel = duration === undefined ? (node.status === 20 || node.status === 30 ? '执行中' : '—') : formatJobDuration(duration);
        const details = <dl className="job-flow-time-details"><dt>任务类</dt><dd>{node.clazzPath}</dd><dt>节点 ID</dt><dd>{node.nodeId}</dd><dt>开始登记</dt><dd>{beginLabel}</dd><dt>结束</dt><dd>{endLabel}</dd>{node.reason && <><dt>原因</dt><dd>{node.reason}</dd></>}</dl>;
        return <div className="job-flow-time-item" key={node.id}>
          <span className="job-flow-time-dot" style={{ background: color }} />
          <article ref={element => { if (element) cards.current.set(node.nodeId, element); else cards.current.delete(node.nodeId); }} className={`job-flow-time-card${selectedNodeId === node.nodeId ? ' is-selected' : ''}`} style={{ borderLeftColor: color }}>
          <button type="button" className="job-flow-time-hit" onClick={() => onSelect(node.nodeId)} aria-pressed={selectedNodeId === node.nodeId} aria-label={`定位节点 ${index + 1} ${node.nodeName}`} />
          <div className="job-flow-time-heading">
            <div className="job-flow-time-select">
              <span className="job-flow-time-number">{String(index + 1).padStart(2, '0')}</span>
              <strong title={node.nodeName}>{node.nodeName}</strong>
              <span className="job-flow-time-duration" title="耗时包含启动排队">{durationLabel}</span>
              <Tag color={stateColor(node.status)}>{executionStates[node.status] ?? '未知状态'}</Tag>
            </div>
            <div className="job-flow-time-icons">
              {renderLog(node)}
              <Popover title="任务详情" content={details} trigger={['hover', 'focus', 'click']} placement="topRight">
                <Button type="text" size="small" icon={<InfoCircleOutlined />} aria-label={`任务详情 ${node.nodeName}`} />
              </Popover>
            </div>
          </div>
            <div className="job-flow-time-range"><span>{compactTime(beginLabel)}</span><span aria-hidden="true">→</span><span>{compactTime(endLabel)}{elapsedDays > 0 && <small className="job-flow-time-day-offset"> +{elapsedDays}天</small>}</span></div>
          <div className="job-flow-time-track" title="所有节点采用同一相对时间刻度；未确认结束只显示开始位置">
            {offset !== undefined && <span style={{ left: `min(calc(100% - 4px), ${offset}%)`, width: width === undefined ? 4 : `max(4px, ${width}%)`, background: color }} />}
          </div>
          {node.reason && <div className="job-flow-time-reason" title={node.reason}>{node.reason}</div>}
          </article>
        </div>;
      })}
    </div>
  </div>;
}
