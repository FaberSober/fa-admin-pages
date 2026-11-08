import { useEffect, useId, useState } from 'react';
import { CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Select, Space, Spin, Tag, Typography } from 'antd';
import { FaJsonView, FaResizeHorizontal, useApiLoading } from '@fa/ui';
import type { Admin } from '@/types';
import { jobApi, jobLogApi } from '@features/fa-admin-pages/services';
import { startFlowRunPolling } from './flowRunPolling';
import JobLogDetailDrawer from '../jobLog/JobLogDetailDrawer';

const nodeStates: Record<number, [string, string]> = {
  0: ['等待依赖', 'default'],
  10: ['待调度', 'default'],
  20: ['启动中', 'processing'],
  30: ['执行中', 'processing'],
  40: ['成功', 'success'],
  50: ['失败', 'error'],
  60: ['已阻断', 'warning'],
  70: ['已停止', 'default'],
  80: ['未确认', 'warning'],
};
const runStates: Record<number, string> = { 1: '执行中', 2: '成功', 8: '未确认', 9: '失败' };

export default function JobFlowRunPanel({ jobId, initialLogId, onClose }: { jobId: number; initialLogId?: number; onClose: () => void }) {
  const panelId = useId();
  const [width, setWidth] = useState(420);
  const [history, setHistory] = useState<Admin.JobLog[]>([]);
  const [selected, setSelected] = useState<number | undefined>(initialLogId);
  const [run, setRun] = useState<Admin.JobFlowRun>();
  const [failed, setFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const loading = useApiLoading([jobApi.getUrl(`flowRuns/${jobId}`), ...(selected ? [jobApi.getUrl(`flowRun/${selected}`)] : [])]);
  useEffect(() => {
    let cancelled = false;
    jobApi
      .flowRuns(jobId)
      .then((res) => {
        if (!cancelled) {
          setHistory(res.data);
          setSelected((value) => value ?? res.data[0]?.id);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, refresh]);
  useEffect(() => {
    if (!selected) return;
    setRun(undefined);
    setFailed(false);
    return startFlowRunPolling({
      read: (signal) => jobApi.flowRun(selected, signal).then((response) => response.data),
      onResult: (value) => {
        setRun(value);
        setHistory((current) => current.map((log) => (log.id === value.log.id ? value.log : log)));
      },
      onError: () => setFailed(true),
    });
  }, [selected, refresh]);
  const options = history.map((log) => ({ value: log.id, label: `#${log.id} · ${log.beginTime ?? ''} · ${runStates[log.status] ?? '未知'}` }));
  if (selected && !options.some((option) => option.value === selected)) options.unshift({ value: selected, label: `#${selected} · 本轮执行` });
  return (
    <div className="job-flow-json-panel">
      <FaResizeHorizontal domId={panelId} position="left" minWidth={360} maxWidth={800} onWidthChange={setWidth} />
      <section id={panelId} className="job-flow-json-frame" style={{ width, borderColor: 'var(--fa-border-color)' }} aria-label="流程运行记录">
        <header className="job-flow-json-header">
          <Typography.Text strong>流程运行记录</Typography.Text>
          <Space size={4}>
            <Button type="text" size="small" icon={<ReloadOutlined />} aria-label="刷新运行记录" onClick={() => setRefresh((value) => value + 1)} />
            <Button type="text" size="small" icon={<CloseOutlined />} aria-label="关闭运行记录" onClick={onClose} />
          </Space>
        </header>
        <div className="job-flow-json-body" style={{ overflow: 'auto' }}>
          <Select aria-label="选择流程运行记录" value={selected} options={options} onChange={setSelected} placeholder="暂无运行记录" />
          <Typography.Text type="secondary">当前阶段按依赖串行执行；运行配置使用启动时关联的历史版本。</Typography.Text>
          {failed && <Alert type="error" title="读取失败，自动刷新已暂停" description="请点击刷新重试。" />}
          <Spin spinning={loading && !run}>
            {run && (
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                <Space wrap>
                  <Typography.Text strong>执行 #{run.log.id}</Typography.Text>
                  <Tag>{runStates[run.log.status] ?? '未知'}</Tag>
                  <span>
                    {run.nodes.filter((node) => node.status === 40).length}/{run.nodes.length} 成功
                  </span>
                </Space>
                {run.log.status === 8 && (
                  <Alert type="warning" title="结果未确认，不能再次启动" description="仍可能有实际工作，需人工核查；不会自动当作成功或重跑。" />
                )}
                {run.log.errMsg && <Alert type="error" title={run.log.errMsg} />}
                <Typography.Text type="secondary">
                  开始：{run.log.beginTime ?? '—'}　结束：{run.log.endTime ?? '—'}
                </Typography.Text>
                <div className="job-flow-preflight-tasks">
                  {run.nodes.map((node, index) => (
                    <article key={node.id} className="job-flow-preflight-task">
                      <span className="job-flow-preflight-task-number">{String(index + 1).padStart(2, '0')}</span>
                      <div className="job-flow-preflight-task-main">
                        <Space wrap>
                          <Typography.Text strong>{node.nodeName}</Typography.Text>
                          <Tag color={nodeStates[node.status]?.[1]}>{nodeStates[node.status]?.[0] ?? '未知'}</Tag>
                        </Space>
                        <div className="job-flow-preflight-class" title={node.clazzPath}>
                          {node.clazzPath}
                        </div>
                        <Typography.Text type="secondary">
                          {node.beginTime ?? '未启动'}
                          {node.endTime ? ` → ${node.endTime}` : ''}
                        </Typography.Text>
                        {node.reason && <div style={{ overflowWrap: 'anywhere' }}>{node.reason}</div>}
                        {node.jobLogId && <NodeBusinessLog id={node.jobLogId} />}
                      </div>
                    </article>
                  ))}
                </div>
                <details>
                  <summary>本轮定义版本 #{run.log.definitionVersionId}</summary>
                  <FaJsonView data={run.definition} defaultExpandDepth={2} />
                </details>
              </Space>
            )}
          </Spin>
        </div>
      </section>
    </div>
  );
}

function NodeBusinessLog({ id }: { id: number }) {
  const [record, setRecord] = useState<Admin.JobLog>();
  const loading = useApiLoading([jobLogApi.getUrl(`getById/${id}`)]);
  if (record) return <JobLogDetailDrawer record={record} defaultOpen />;
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
