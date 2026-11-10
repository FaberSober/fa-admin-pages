import { useEffect, useId, useState } from 'react';
import { CloseOutlined, FullscreenOutlined, FullscreenExitOutlined, ReloadOutlined, InfoCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { Alert, Button, Popconfirm, Popover, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import { FaJsonView, FaResizeHorizontal, useApiLoading } from '@fa/ui';
import type { Admin } from '@/types';
import { jobApi, jobLogApi } from '@features/fa-admin-pages/services';
import { startFlowRunPolling } from './flowRunPolling';
import JobFlowHistoryList from './JobFlowHistoryList';
import JobFlowRunCanvas from './JobFlowRunCanvas';
import JobFlowExecutionTimeline from './JobFlowExecutionTimeline';
import { executionDateRange } from './flowExecutionTimeline';
import { formatJobDuration } from '../jobStatistics';
import JobLogDetailDrawer from '../jobLog/JobLogDetailDrawer';

const runStates: Record<number, string> = { 1: '执行中', 2: '成功', 3: '停止中', 7: '已停止', 8: '未确认', 9: '失败' };

function JobFlowRunPanelContent({ jobId, initialLogId, initialNodeId, onClose }: { jobId: number; initialLogId?: number; initialNodeId?: string; onClose: () => void }) {
  const panelId = useId();
  const [width, setWidth] = useState(540);
  const [historyWidth, setHistoryWidth] = useState(780);
  const [expanded, setExpanded] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [showHistory, setShowHistory] = useState(initialLogId === undefined);
  const [historyOpened, setHistoryOpened] = useState(initialLogId === undefined);
  const [selected, setSelected] = useState<number | undefined>(initialLogId);
  const [run, setRun] = useState<Admin.JobFlowRun>();
  const [failed, setFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const reconciling = useApiLoading(selected ? [jobApi.getUrl(`reconcileFlow/${selected}`)] : []);
  const stopping = useApiLoading(selected ? [jobApi.getUrl(`stopFlow/${selected}`)] : []);
  const loading = useApiLoading(selected ? [jobApi.getUrl(`flowRun/${selected}`)] : []);
  useEffect(() => {
    setSelectedNodeId(selected === initialLogId ? initialNodeId : undefined);
  }, [selected, jobId, initialLogId, initialNodeId]);
  useEffect(() => {
    if (!selected || showHistory) return;
    setRun(undefined);
    setFailed(false);
    return startFlowRunPolling({
      read: (signal) => jobApi.flowRun(selected, signal, jobId).then((response) => response.data),
      onResult: (value) => {
        setRun(value);
      },
      onError: () => setFailed(true),
    });
  }, [selected, refresh, showHistory, jobId]);
  const active = run?.nodes.filter((node) => node.status === 20 || node.status === 30).length ?? 0;
  const unconfirmed = run?.nodes.filter((node) => node.status === 80).length ?? 0;
  return (
    <div className={`job-flow-json-panel${expanded ? ' job-flow-json-panel--expanded' : ''}`}>
      {!expanded && <FaResizeHorizontal domId={panelId} position="left" minWidth={360} maxWidth={900} onWidthChange={showHistory ? setHistoryWidth : setWidth} />}
      <section id={panelId} className="job-flow-json-frame job-flow-run-frame" style={{ width: expanded ? '100%' : showHistory ? historyWidth : width, borderColor: 'var(--fa-border-color)' }} aria-label="流程运行记录">
        <header className="job-flow-json-header">
          <Typography.Text strong>{showHistory ? '流程历史记录' : '流程运行详情'}</Typography.Text>
          <Space size={4}>
            <Button type="text" size="small" icon={expanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />} aria-label={expanded ? '收起运行详情' : '展开运行详情'} onClick={() => setExpanded(value => !value)} />
            <Button type="text" size="small" icon={<ReloadOutlined />} aria-label="刷新运行记录" onClick={() => setRefresh((value) => value + 1)} />
            <Button type="text" size="small" icon={<CloseOutlined />} aria-label="关闭运行记录" onClick={onClose} />
          </Space>
        </header>
        <div className="job-flow-json-body" style={{ overflow: 'auto' }}>
          <div style={{ display: showHistory ? undefined : 'none' }}>
            {historyOpened && <JobFlowHistoryList active={showHistory} refreshToken={refresh} jobId={jobId} selected={selected} onSelect={id => { setSelected(id); setShowHistory(false); }} />}
          </div>
          <div style={{ display: showHistory ? 'none' : undefined }}>
          {failed && <Alert type="error" title="读取失败，自动刷新已暂停" description="记录可能不存在或不属于当前流程，也可能是网络异常。请刷新重试或从历史记录重新选择。" />}
          {!run && <Space style={{ justifyContent: 'space-between', width: '100%' }}><Typography.Text type="secondary">运行 #{selected ?? '—'}{loading ? ' · 加载中' : ''}</Typography.Text><Button size="small" onClick={() => { setHistoryOpened(true); setShowHistory(true); }}>返回历史列表</Button></Space>}
          <Spin spinning={loading && !run}>
            {run && (
              <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                <div className="job-flow-run-summary">
                  <Space wrap size={8}>
                    <Typography.Text strong>执行 #{run.log.id}</Typography.Text>
                    <Tag color={run.log.status === 2 ? 'success' : run.log.status === 9 ? 'error' : run.log.status === 1 || run.log.status === 3 ? 'processing' : run.log.status === 8 ? 'warning' : undefined}>{runStates[run.log.status] ?? '未知'}</Tag>
                  {run.log.status === 1 && <Popconfirm title="停止当前这轮流程？" description={<div style={{ maxWidth: 280 }}>不再启动新节点，已运行任务继续收尾。未来 Cron 仍会触发，如需暂停请返回任务列表。</div>} okText="停止本轮" onConfirm={() => jobApi.stopFlow(run.log.id, jobId).then(() => setRefresh(value => value + 1))}><Button size="small" danger loading={stopping}>停止本轮</Button></Popconfirm>}
                  {run.log.status === 3 && <Typography.Text type="warning">等待已运行任务收尾</Typography.Text>}
                  {(run.log.status === 1 || run.log.status === 3) && <Tooltip title="同步已保存的节点结果并恢复依赖推进，不重新执行业务；未确认结果不会视为成功。"><Button size="small" loading={reconciling} onClick={() => jobApi.reconcileFlow(run.log.id, jobId).then(() => setRefresh(value => value + 1)).catch(() => {})}>核对状态</Button></Tooltip>}
                  </Space>
                  <Space size={4} wrap>
                    <Popover title="运行说明" trigger={['hover', 'focus', 'click']} content={<div style={{ maxWidth: 340, lineHeight: 1.8 }}>
                      <div>按依赖与并发上限运行，同类任务串行；使用启动时关联的历史版本。</div>
                      <div>时间条使用统一刻度，耗时包含启动排队；点击节点或卡片可互相定位。</div>
                      <div>开始：{run.log.beginTime ?? '—'}</div><div>结束：{run.log.endTime ?? '—'}</div>
                      <div>未确认 {unconfirmed} 个仍占用容量，不按成功放行。</div>
                    </div>}><Button type="text" size="small" icon={<InfoCircleOutlined />} aria-label="运行说明" /></Popover>
                    <Popover key={run.log.id} title={`本轮定义版本 #${run.log.definitionVersionId ?? '—'}`} trigger="click" content={<div style={{ width: 'min(620px, calc(100vw - 80px))', maxHeight: '60vh', overflow: 'auto' }}><FaJsonView data={run.definition} defaultExpandDepth={2} /></div>}><Button size="small" type="text">版本 #{run.log.definitionVersionId ?? '—'}</Button></Popover>
                    <Button size="small" onClick={() => { setHistoryOpened(true); setShowHistory(true); }}>返回历史列表</Button>
                  </Space>
                </div>
                <Space wrap size={14} className="job-flow-run-meta">
                  <span>{run.nodes.length} 个任务</span>
                  <Tooltip title="启动中、执行中及未确认工作占用并发容量"><span>并发 {active + unconfirmed}/{String(run.definition.maxConcurrency ?? '—')}</span></Tooltip>
                  <span>等待 {run.nodes.filter(node => node.status === 0 || node.status === 10).length}</span>
                  <span>成功 {run.nodes.filter(node => node.status === 40).length}</span>
                  <span>失败 {run.nodes.filter(node => node.status === 50).length}</span>
                  {run.nodes.some(node => node.status === 60) && <span>阻断 {run.nodes.filter(node => node.status === 60).length}</span>}
                  {unconfirmed > 0 && <Typography.Text type="warning">未确认 {unconfirmed} · 已暂停新启动</Typography.Text>}
                </Space>
                {run.log.errMsg && run.log.status !== 3 && <Tooltip title={run.log.errMsg}><Typography.Text type={run.log.status === 9 ? 'danger' : run.log.status === 8 ? 'warning' : 'secondary'} ellipsis style={{ maxWidth: '100%' }}>{run.log.errMsg}</Typography.Text></Tooltip>}
                <div className="job-flow-run-split">
                <div className="job-flow-run-canvas-area">
                  <JobFlowRunCanvas run={run} selectedNodeId={selectedNodeId} onSelect={id => { setSelectedNodeId(id); }} />
                </div>
                <div className="job-flow-run-records">
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Typography.Text strong>执行节点 · {run.nodes.length}</Typography.Text>
                  <Space size={12} wrap><Typography.Text type="secondary">{executionDateRange(run)}</Typography.Text><Typography.Text type="secondary">总耗时 {formatJobDuration(run.log.durationMs)}</Typography.Text></Space>
                </Space>
                <JobFlowExecutionTimeline key={run.log.id} run={run} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId}
                  renderLog={node => node.jobLogId ? <NodeBusinessLog key={node.jobLogId} id={node.jobLogId} onLocateFlow={origin => {
                    if (origin.jobId === jobId && origin.flowLogId === run.log.id) setSelectedNodeId(origin.nodeId);
                  }} /> : <Tooltip title="暂无关联执行日志"><Button type="text" size="small" disabled icon={<FileTextOutlined />} aria-label="暂无关联执行日志" /></Tooltip>} />

                </div>
                </div>
              </Space>
            )}
          </Spin>
          </div>
        </div>
      </section>
    </div>
  );
}

function NodeBusinessLog({ id, onLocateFlow }: { id: number; onLocateFlow: (origin: Admin.JobFlowLogOrigin) => void }) {
  const [record, setRecord] = useState<Admin.JobLog>();
  const loading = useApiLoading([jobLogApi.getUrl(`getById/${id}`)]);
  if (record) return <JobLogDetailDrawer record={record} defaultOpen iconOnly onLocateFlow={onLocateFlow} />;
  return (
    <Button
      type="text"
      size="small"
      icon={<FileTextOutlined />}
      aria-label={`查看执行日志 #${id}`}
      title={`查看执行日志 #${id}`}
      loading={loading}
      onClick={() => {
        jobLogApi
          .getById(id)
          .then((res) => setRecord(res.data))
          .catch(() => {});
      }}
    />
  );
}

export default function JobFlowRunPanel(props: { jobId: number; initialLogId?: number; initialNodeId?: string; onClose: () => void }) {
  return <JobFlowRunPanelContent key={props.jobId} {...props} />;
}
