import { useEffect, useId, useState } from 'react';
import { CloseOutlined, FullscreenOutlined, FullscreenExitOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Popconfirm, Segmented, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import { FaJsonView, FaResizeHorizontal, useApiLoading } from '@fa/ui';
import type { Admin } from '@/types';
import { jobApi, jobLogApi } from '@features/fa-admin-pages/services';
import { startFlowRunPolling } from './flowRunPolling';
import JobFlowHistoryList from './JobFlowHistoryList';
import JobFlowRunCanvas from './JobFlowRunCanvas';
import JobFlowExecutionTimeline from './JobFlowExecutionTimeline';
import { getNodeDurationMs } from './flowExecutionTimeline';
import JobLogDetailDrawer from '../jobLog/JobLogDetailDrawer';

const nodeStates: Record<number, [string, string]> = {
  0: ['等待执行', 'default'],
  10: ['待调度', 'default'],
  20: ['启动中', 'processing'],
  30: ['执行中', 'processing'],
  40: ['成功', 'success'],
  50: ['失败', 'error'],
  60: ['已阻断', 'warning'],
  70: ['已停止', 'default'],
  80: ['未确认', 'warning'],
};
const runStates: Record<number, string> = { 1: '执行中', 2: '成功', 3: '停止中', 7: '已停止', 8: '未确认', 9: '失败' };

function JobFlowRunPanelContent({ jobId, initialLogId, initialNodeId, onClose }: { jobId: number; initialLogId?: number; initialNodeId?: string; onClose: () => void }) {
  const panelId = useId();
  const [width, setWidth] = useState(540);
  const [historyWidth, setHistoryWidth] = useState(780);
  const [expanded, setExpanded] = useState(false);
  const [recordView, setRecordView] = useState<string>('nodes');
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
    setRecordView('nodes');
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
          {!showHistory && <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Typography.Text>{selected ? `当前运行 #${selected} · ${run ? runStates[run.log.status] ?? '未知' : '加载中'}` : '暂无运行记录'}</Typography.Text>
            <Button onClick={() => { setHistoryOpened(true); setShowHistory(true); }}>返回历史列表</Button>
          </Space>}
          <div style={{ display: showHistory ? undefined : 'none' }}>
            {historyOpened && <JobFlowHistoryList active={showHistory} refreshToken={refresh} jobId={jobId} selected={selected} onSelect={id => { setSelected(id); setShowHistory(false); }} />}
          </div>
          <div style={{ display: showHistory ? 'none' : undefined }}>
          <Typography.Text type="secondary">按依赖和并发上限运行，同类任务串行；配置使用启动时关联的历史版本。</Typography.Text>
          {failed && <Alert type="error" title="读取失败，自动刷新已暂停" description="记录可能不存在或不属于当前流程，也可能是网络异常。请刷新重试或从历史记录重新选择。" />}
          <Spin spinning={loading && !run}>
            {run && (
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                <Space wrap>
                  <Typography.Text strong>执行 #{run.log.id}</Typography.Text>
                  <Tag>{runStates[run.log.status] ?? '未知'}</Tag>
                  {run.log.status === 1 && <Popconfirm title="停止当前这轮流程？" description={<div style={{ maxWidth: 280 }}>不再启动新节点，已运行任务继续收尾。未来 Cron 仍会触发，如需暂停请返回任务列表。</div>} okText="停止本轮" onConfirm={() => jobApi.stopFlow(run.log.id, jobId).then(() => setRefresh(value => value + 1))}><Button size="small" danger loading={stopping}>停止本轮</Button></Popconfirm>}
                  {run.log.status === 3 && <Typography.Text type="warning">等待已运行任务收尾</Typography.Text>}
                  {(run.log.status === 1 || run.log.status === 3) && <Tooltip title="同步已保存的节点结果并恢复依赖推进，不重新执行业务；未确认结果不会视为成功。"><Button size="small" loading={reconciling} onClick={() => jobApi.reconcileFlow(run.log.id, jobId).then(() => setRefresh(value => value + 1)).catch(() => {})}>核对状态</Button></Tooltip>}
                  <Typography.Text type="secondary">{run.nodes.length} 个任务</Typography.Text>
                  {unconfirmed > 0 && <Tag color="warning">{unconfirmed} 未确认 · 已暂停新启动</Tag>}
                </Space>
                <div className="job-flow-preflight-metrics">
                  <Tooltip title={`启动中或执行中 ${active} 个；未确认 ${unconfirmed} 个仍占用容量。`}>
                    <div>
                      <strong>{active + unconfirmed}/{String(run.definition.maxConcurrency ?? '—')}</strong>
                      <span>并发占用</span>
                    </div>
                  </Tooltip>
                  {[
                    ['等待', run.nodes.filter((node) => node.status === 0 || node.status === 10).length],
                    ['成功', run.nodes.filter((node) => node.status === 40).length],
                    ['失败', run.nodes.filter((node) => node.status === 50).length],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                {run.nodes.some((node) => node.status === 60) && <Tag>{run.nodes.filter((node) => node.status === 60).length} 已阻断</Tag>}
                {run.log.status === 8 && (
                  <Alert type="warning" title="结果未确认，不能再次启动" description="仍可能有实际工作，需人工核查；不会自动当作成功或重跑。" />
                )}
                {run.log.errMsg && run.log.status !== 3 && (run.log.status === 7 ? <Typography.Text type="secondary">{run.log.errMsg}</Typography.Text> : <Alert type="error" title={run.log.errMsg} />)}
                <Typography.Text type="secondary">
                  开始：{run.log.beginTime ?? '—'}　结束：{run.log.endTime ?? '—'}
                </Typography.Text>
                <div className="job-flow-run-split">
                <div className="job-flow-run-canvas-area">
                  <JobFlowRunCanvas run={run} selectedNodeId={selectedNodeId} onSelect={id => { setSelectedNodeId(id); setRecordView('nodes'); }} />
                </div>
                <div className="job-flow-run-records">
                <Segmented aria-label="运行详情视图" value={recordView} options={[{ label: '节点记录', value: 'nodes' }, { label: '执行时间线', value: 'timeline' }]} onChange={value => setRecordView(String(value))} />
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Typography.Text type="secondary">{selectedNodeId ? '选中节点详情' : '点击运行图或时间线查看节点详情'} · 总耗时 {run.log.durationMs == null ? '—' : `${run.log.durationMs} ms`}</Typography.Text>
                  {selectedNodeId && <Button type="link" size="small" onClick={() => setSelectedNodeId(undefined)}>显示全部节点</Button>}
                </Space>
                {recordView === 'timeline' && <JobFlowExecutionTimeline run={run} selectedNodeId={selectedNodeId} onSelect={id => { setSelectedNodeId(id); setRecordView('nodes'); }} />}
                <div className="job-flow-preflight-tasks" style={{ display: recordView === 'nodes' ? undefined : 'none' }}>
                  {selectedNodeId && !run.nodes.some(node => node.nodeId === selectedNodeId) && <Typography.Text type="secondary">该节点暂无运行记录，无法确认执行状态。</Typography.Text>}
                  {run.nodes.map((node, index) => (!selectedNodeId || node.nodeId === selectedNodeId) && (
                    <article key={node.id} className="job-flow-preflight-task">
                      <span className="job-flow-preflight-task-number">{String(index + 1).padStart(2, '0')}</span>
                      <div className="job-flow-preflight-task-main">
                        <Space wrap>
                          <Typography.Text strong>{node.nodeName}</Typography.Text>
                          <Tooltip title={node.status === 0 || node.status === 10 ? '等待前驱成功、并发空位或同类任务结束。' : undefined}>
                            <Tag color={nodeStates[node.status]?.[1]}>{nodeStates[node.status]?.[0] ?? '未知'}</Tag>
                          </Tooltip>
                        </Space>
                        <div className="job-flow-preflight-class" title={node.clazzPath}>
                          {node.clazzPath}
                        </div>
                        <Typography.Text type="secondary">
                          {node.beginTime ?? '未启动'}
                          {node.endTime ? ` → ${node.endTime}` : ''}
                          {' · 耗时 '}{getNodeDurationMs(node) == null ? (node.status === 80 ? '未确认' : node.status === 20 || node.status === 30 ? '执行中' : '—') : `${getNodeDurationMs(node)} ms`}
                        </Typography.Text>
                        {node.reason && <div style={{ overflowWrap: 'anywhere' }}>{node.reason}</div>}
                        {node.jobLogId && <NodeBusinessLog key={node.jobLogId} id={node.jobLogId} onLocateFlow={origin => { if (origin.jobId === jobId && origin.flowLogId === run.log.id) { setSelectedNodeId(origin.nodeId); setRecordView('nodes'); } }} />}
                      </div>
                    </article>
                  ))}
                </div>
                <details>
                  <summary>本轮定义版本 #{run.log.definitionVersionId}</summary>
                  <FaJsonView data={run.definition} defaultExpandDepth={2} />
                </details>
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
  if (record) return <JobLogDetailDrawer record={record} defaultOpen onLocateFlow={onLocateFlow} />;
  return (
    <Button
      type="link"
      size="small"
      loading={loading}
      onClick={() => {
        jobLogApi
          .getById(id)
          .then((res) => setRecord(res.data))
          .catch(() => {});
      }}
    >
      查看执行日志 #{id}
    </Button>
  );
}

export default function JobFlowRunPanel(props: { jobId: number; initialLogId?: number; initialNodeId?: string; onClose: () => void }) {
  return <JobFlowRunPanelContent key={props.jobId} {...props} />;
}
