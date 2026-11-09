import { useEffect, useId, useRef, useState } from 'react';
import { CloseOutlined, ReloadOutlined, SafetyCertificateOutlined, CheckCircleFilled, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Button, Space, Spin, Tooltip, Popover, Typography } from 'antd';
import { FaResizeHorizontal, FaUtils, useApiLoading } from '@fa/ui';
import type { Admin } from '@/types';
import { jobApi } from '@features/fa-admin-pages/services';

export default function JobFlowPreflightPanel({
  jobId,
  selectedNodeId,
  onLocateNode,
  onClose,
}: {
  jobId: number;
  selectedNodeId?: string;
  onLocateNode: (id: string, panelWidth: number) => void;
  onClose: () => void;
}) {
  const panelId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(420);
  const [result, setResult] = useState<Admin.JobFlowPreflight>();
  const [failed, setFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const loading = useApiLoading([jobApi.getUrl(`preflightFlow/${jobId}`)]);
  useEffect(() => {
    let cancelled = false;
    setResult(undefined);
    setFailed(false);
    jobApi
      .preflightFlow(jobId)
      .then((response) => {
        if (!cancelled) setResult(response.data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, refresh]);
  const labels = new Map(result?.layers.flat().map((node, index) => [node.id, { name: node.name, number: String(index + 1).padStart(2, '0') }]));
  return (
    <div className="job-flow-json-panel">
      <FaResizeHorizontal domId={panelId} position="left" minWidth={360} maxWidth={800} onWidthChange={setWidth} />
      <section ref={panelRef} id={panelId} className="job-flow-json-frame" aria-label="运行前检查" style={{ width, borderColor: 'var(--fa-border-color)' }}>
        <header className="job-flow-json-header">
          <Space>
            <SafetyCertificateOutlined />
            <Typography.Text strong>运行前检查</Typography.Text>
          </Space>
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              aria-label="重新检查"
              loading={loading}
              onClick={() => setRefresh((value) => value + 1)}
            />
            <Button type="text" size="small" icon={<CloseOutlined />} aria-label="关闭运行前检查" onClick={onClose} />
          </Space>
        </header>
        <div className="job-flow-preflight-summary">
          <div className="job-flow-preflight-status">
            <span>
              {result ? (
                <>
                  <CheckCircleFilled className="job-flow-preflight-success" /> 检查通过
                </>
              ) : failed ? (
                '检查未通过'
              ) : (
                '正在检查'
              )}
            </span>
            <span className="job-flow-preflight-note">
              已保存版本 · 未执行
              <Tooltip title="仅读取服务器已保存定义，未保存修改不参与检查。层级表示依赖关系，不是执行屏障；实际并发和异步完成由执行器判断。">
                <InfoCircleOutlined aria-label="检查说明" tabIndex={0} />
              </Tooltip>
            </span>
          </div>
          {result && (
            <>
              <Typography.Text strong ellipsis title={result.jobName}>
                {result.jobName}
              </Typography.Text>
              <div className="job-flow-preflight-metrics">
                {[
                  ['任务', result.nodeCount],
                  ['依赖', result.edgeCount],
                  ['层级', result.layers.length],
                  ['并发上限', result.maxConcurrency],
                ].map(([label, value]) => (
                  <div key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              {result.repeatedClasses.length > 0 && (
                <Popover
                  trigger="click"
                  title="重复引用的任务类"
                  content={
                    <div style={{ maxWidth: 420, overflowWrap: 'anywhere' }}>
                      {result.repeatedClasses.map((path) => (
                        <div key={path}>{path}</div>
                      ))}
                      <Typography.Text type="secondary">执行时同类任务串行，不同任务类可按并发上限运行；本次仅检查定义。</Typography.Text>
                    </div>
                  }
                >
                  <Button type="text" size="small" className="job-flow-preflight-repeat" icon={<WarningOutlined />}>
                    {result.repeatedClasses.length} 种任务类被重复引用 · 查看
                  </Button>
                </Popover>
              )}
            </>
          )}
        </div>
        <Spin spinning={loading} wrapperClassName="job-flow-preflight-content">
          {failed && <Alert type="error" showIcon title="检查未通过或请求失败" description="请检查服务端错误提示，修正并保存流程后重新检查。" />}
          {result &&
            result.layers.map((layer, index) => (
              <section key={layer[0].id} className="job-flow-preflight-layer" aria-label={`层级 ${index + 1}，${layer.length} 个任务`}>
                <div className="job-flow-preflight-layer-heading">
                  <span>
                    <span className="job-flow-preflight-layer-index">{String(index + 1).padStart(2, '0')}</span>依赖层级{index === 0 && <small>入口</small>}
                  </span>
                  <span>{layer.length} 个任务</span>
                </div>
                <div className="job-flow-preflight-tasks">
                  {layer.map((node) => (
                    <article
                      key={node.id}
                      className={`job-flow-preflight-task job-flow-preflight-task--locatable ${selectedNodeId === node.id ? 'is-selected' : ''}`}
                      onClick={() => onLocateNode(node.id, panelRef.current?.getBoundingClientRect().width ?? width)}
                    >
                      <span className="job-flow-preflight-task-number">{labels.get(node.id)?.number}</span>
                      <div className="job-flow-preflight-task-main">
                        <div className="job-flow-preflight-task-title">
                          <button
                            type="button"
                            className="job-flow-preflight-locate"
                            aria-label={`定位节点 ${labels.get(node.id)?.number} ${node.name}`}
                            aria-pressed={selectedNodeId === node.id}
                          >
                            {node.name}
                          </button>
                          {node.predecessors.length === 0 && <small>入口</small>}
                        </div>
                        <button
                          type="button"
                          className="job-flow-preflight-class"
                          title={`${node.clazzPath} · 点击复制`}
                          aria-label={`复制任务类 ${node.clazzPath}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            FaUtils.copyToClipboard(node.clazzPath, '任务类路径');
                          }}
                        >
                          {node.clazzPath}
                        </button>
                        {node.predecessors.length > 0 && (
                          <div className="job-flow-preflight-predecessors">
                            <span>前驱</span>
                            {node.predecessors.map((id) => (
                              <Tooltip key={id} title={`${labels.get(id)?.name ?? id} · ${id}`}>
                                <span className="job-flow-preflight-predecessor">
                                  #{labels.get(id)?.number ?? '?'} {labels.get(id)?.name ?? id}
                                </span>
                              </Tooltip>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
        </Spin>
      </section>
    </div>
  );
}
