import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { FaResizeHorizontal, ThemeLayoutContext, useApiLoading } from '@fa/ui';
import { createPortal } from 'react-dom';
import { Alert, Button, Form, Input, InputNumber, Popover, Select, Space, Tooltip, Typography, message, theme } from 'antd';
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CloseOutlined,
  CodeOutlined,
  InfoCircleOutlined,
  LayoutOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import './job-flow-preview.scss';
import type { Admin } from '@/types';
import { jobApi } from '@features/fa-admin-pages/services';
import { getFlowTaskOptions } from './jobFlowTasks';
import useJobFlowAlignment from './useJobFlowAlignment';
import JobFlowAlignmentGuides from './JobFlowAlignmentGuides';
import JobFlowJsonPanel from './JobFlowJsonPanel';
import { layoutFlow, parseFlowDefinition, validateFlow, type FlowNode } from './flowDefinition';

// 以验收截图中约 128px 宽的默认 150px 节点作为 100% 显示基准。
const BASE_ZOOM = 0.85;

const demoJobs = [
  { value: 'demo.DataPrepare', label: '示例：数据准备', name: '示例：数据准备' },
  { value: 'demo.GenerateReport', label: '示例：生成报表', name: '示例：生成报表' },
  { value: 'demo.SendNotice', label: '示例：发送通知', name: '示例：发送通知' },
];
type TaskNode = Node<{ label: string; clazzPath: string }>;
const initialNodes: TaskNode[] = demoJobs.map((job, index) => ({
  id: `demo-${job.value}`,
  position: { x: 100, y: 40 + index * 150 },
  data: { label: job.label, clazzPath: job.value },
}));
const initialEdges = [
  { id: 'demo-edge-1', source: 'demo-1', target: 'demo-2' },
  { id: 'demo-edge-2', source: 'demo-2', target: 'demo-3' },
];

/** 独立的页面原型，不提交配置或触发真实任务。 */
export default function JobFlowPreview({ record, fetchFinish }: { record?: Admin.Job; fetchFinish?: () => void }) {
  return (
    <Space>
      <ReactFlowProvider>
        <JobFlowEditor demo={false} record={record} fetchFinish={fetchFinish} />
      </ReactFlowProvider>
      {!record && (
        <ReactFlowProvider>
          <JobFlowEditor demo />
        </ReactFlowProvider>
      )}
    </Space>
  );
}

function JobFlowEditor({ demo, record, fetchFinish }: { demo: boolean; record?: Admin.Job; fetchFinish?: () => void }) {
  const { themeDark } = useContext(ThemeLayoutContext);
  const { token } = theme.useToken();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const configPanelId = useId();
  const [showConfig, setShowConfig] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    setMountNode(anchor?.closest<HTMLElement>('[data-fa-tab-panel]') ?? anchor?.closest<HTMLElement>('.fa-main') ?? null);
  }, []);
  const flowInstance = useRef<ReactFlowInstance<TaskNode> | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showTests, setShowTests] = useState(false);
  const [zoom, setZoom] = useState(BASE_ZOOM);
  const [open, setOpen] = useState(false);
  const loadedRecord = useRef(false);
  const [persistedId, setPersistedId] = useState<number | undefined>(record?.id);
  const saving = useApiLoading([jobApi.getUrl('save'), jobApi.getUrl('update')]);
  const [name, setName] = useState(demo ? '示例串行任务流' : '新建任务流');
  const [concurrency, setConcurrency] = useState(2);
  const [clazzPath, setClazzPath] = useState<string | undefined>(demo ? 'demo.DataPrepare' : undefined);
  const [nodes, setNodes] = useNodesState<TaskNode>(demo ? initialNodes : []);
  const alignment = useJobFlowAlignment<TaskNode>(setNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(demo ? initialEdges : []);
  const [json, setJson] = useState<string>();
  const [saved, setSaved] = useState<string>();
  const [configuredJobs, setConfiguredJobs] = useState<ReturnType<typeof getFlowTaskOptions>>([]);
  const [taskError, setTaskError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const tasksLoading = useApiLoading([jobApi.getUrl('getAllJobs')]);
  const jobs = demo ? demoJobs : configuredJobs;
  useEffect(() => {
    if (!open || demo) return;
    let cancelled = false;
    setTaskError(false);
    setConfiguredJobs([]);
    Promise.all([jobApi.getAllJobs(), record ? jobApi.getById(record.id) : Promise.resolve(undefined)])
      .then(([res, detail]) => {
        if (cancelled) return;
        const options = getFlowTaskOptions(res.data);
        setConfiguredJobs(options);
        if (detail && !loadedRecord.current) {
          loadedRecord.current = true;
          const definition = parseFlowDefinition(
            detail.data.flowDefinition ?? '',
            options.map((job) => job.value),
          );
          setName(detail.data.jobName);
          setConcurrency(definition.maxConcurrency);
          setNodes(definition.nodes.map((node) => ({ id: node.id, position: node.position, data: { label: node.name, clazzPath: node.clazzPath } })));
          setEdges(definition.edges.map((edge, index) => ({ ...edge, id: `loaded-${index}` })));
        }
      })
      .catch(() => {
        if (!cancelled) setTaskError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, demo, refresh, record, setNodes, setEdges]);
  const sequence = useRef(0);
  const [feedback, contextHolder] = message.useMessage();
  const flowNodes = (): FlowNode[] => nodes.map((node) => ({ id: node.id, clazzPath: node.data.clazzPath, name: node.data.label, position: node.position }));

  function connect(connection: Connection) {
    const edge = { ...connection, id: `edge-${++sequence.current}` };
    const error = validateFlow(flowNodes(), [...edges, edge]);
    if (error) {
      feedback.warning(error);
      return;
    }
    setEdges((current) => [...current, edge]);
  }

  function definition() {
    const error = validateFlow(flowNodes(), edges);
    if (error || !name.trim()) {
      feedback.warning(error ?? '请输入流程名称');
      return;
    }
    const source = JSON.stringify(
      { schemaVersion: 1, name: name.trim(), maxConcurrency: concurrency, nodes: flowNodes(), edges: edges.map(({ source, target }) => ({ source, target })) },
      null,
      2,
    );
    try {
      parseFlowDefinition(
        source,
        jobs.map((job) => job.value),
      );
      return source;
    } catch (error) {
      feedback.warning(error instanceof Error ? error.message : '流程定义无效');
    }
  }

  async function saveFlow() {
    const source = definition();
    if (!source) return;
    const values = { jobName: name.trim(), jobType: 1, flowDefinition: source, status: false, cron: '0 * * * * ?', clazzPath: '' };
    if (persistedId) await jobApi.update(persistedId, { id: persistedId, ...values });
    else {
      const res = await jobApi.save(values);
      setPersistedId(res.data.id);
    }
    feedback.success('流程定义已保存，执行与调度尚未接入');
    fetchFinish?.();
  }

  return (
    <>
      {contextHolder}
      <Button
        onClick={() => {
          loadedRecord.current = false;
          setOpen(true);
        }}
      >
        {demo ? '流程编排预览' : record ? '编排' : '新建任务流'}
      </Button>
      <span ref={anchorRef} style={{ display: 'none' }} />
      {open &&
        mountNode &&
        createPortal(
          <div className={`job-flow-editor fa-full-content ${fullscreen ? 'job-flow-editor--fullscreen' : ''}`}>
            <section className="job-flow-toolbar" aria-label="任务流编排工具栏">
              <div className="job-flow-toolbar-context">
                <Tooltip title="返回任务列表">
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    aria-label="返回任务列表"
                    onClick={() => {
                      setOpen(false);
                      setFullscreen(false);
                      setJson(undefined);
                    }}
                  />
                </Tooltip>
                <span className="job-flow-toolbar-divider" aria-hidden="true" />
                <strong className="job-flow-toolbar-name" title={name}>
                  {name}
                </strong>
                <span className="job-flow-toolbar-status">{demo ? '模拟编排' : persistedId ? '流程定义 · 已建档' : '注册任务 · 未保存'}</span>
                <span className="job-flow-toolbar-summary">
                  {nodes.length} 个节点 · {edges.length} 条依赖
                </span>
              </div>
              <div className="job-flow-toolbar-actions">
                <Tooltip title="流程配置">
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                    aria-label="流程配置"
                    aria-pressed={showConfig}
                    onClick={() => {
                      setJson(undefined);
                      setShowConfig((value) => !value);
                    }}
                  />
                </Tooltip>
                <Popover
                  title="添加注册任务节点"
                  trigger="click"
                  content={
                    <Space orientation="vertical" style={{ width: 320, maxWidth: '80vw' }}>
                      {!demo && (
                        <>
                          <Typography.Text type="secondary">
                            直接选择后台注册的 Java 任务类，无需在定时任务列表另建记录；同一任务类可添加为多个独立节点。
                          </Typography.Text>
                          <Button loading={tasksLoading} onClick={() => setRefresh((value) => value + 1)}>
                            刷新任务列表
                          </Button>
                          {taskError && <Alert type="error" title="任务加载失败，请刷新重试" />}
                          {!tasksLoading && !taskError && jobs.length === 0 && <Alert type="info" title="暂无已注册任务类，请确认后台任务注册配置后刷新" />}
                        </>
                      )}
                      <Select
                        aria-label="选择普通任务"
                        value={clazzPath}
                        options={jobs}
                        showSearch
                        optionFilterProp="label"
                        loading={tasksLoading}
                        placeholder="选择已注册的任务类"
                        onChange={setClazzPath}
                        style={{ width: '100%' }}
                      />
                      <Button
                        icon={<PlusOutlined />}
                        disabled={nodes.length >= 100 || tasksLoading || !jobs.some((job) => job.value === clazzPath)}
                        onClick={() => {
                          const job = jobs.find((item) => item.value === clazzPath)!;
                          setNodes((current) => [
                            ...current,
                            { id: `node-${crypto.randomUUID()}`, position: { x: 360, y: 40 }, data: { label: job.name, clazzPath: job.value } },
                          ]);
                        }}
                      >
                        添加节点
                      </Button>
                      <Button
                        icon={<ApartmentOutlined />}
                        onClick={() => {
                          const error = validateFlow(flowNodes(), edges);
                          if (error) {
                            feedback.warning(error);
                            return;
                          }
                          const positions = new Map(layoutFlow(flowNodes(), edges).map((node) => [node.id, node.position]));
                          setNodes((current) => current.map((node) => ({ ...node, position: positions.get(node.id)! })));
                        }}
                      >
                        自动布局
                      </Button>
                    </Space>
                  }
                >
                  <Tooltip title="节点与布局">
                    <Button type="text" icon={<PlusOutlined />} aria-label="节点与布局" />
                  </Tooltip>
                </Popover>
                <span className="job-flow-toolbar-divider" aria-hidden="true" />
                <Tooltip title="校验并预览 JSON">
                  <Button
                    type="text"
                    icon={<CodeOutlined />}
                    aria-label="校验并预览 JSON"
                    onClick={() => {
                      const value = definition();
                      if (value) {
                        setShowConfig(false);
                        setJson(value);
                      }
                    }}
                  />
                </Tooltip>
                <span className="job-flow-toolbar-divider" aria-hidden="true" />
                {!demo && (
                  <Button
                    type="primary"
                    loading={saving}
                    disabled={taskError || tasksLoading}
                    icon={<SaveOutlined />}
                    onClick={() => {
                      saveFlow().catch(() => {});
                    }}
                  >
                    保存
                  </Button>
                )}
                <Button
                  icon={<SaveOutlined />}
                  onClick={() => {
                    const value = definition();
                    if (value) {
                      setSaved(value);
                      feedback.success('草稿已暂存于当前页面');
                    }
                  }}
                >
                  暂存
                </Button>
                <Tooltip title={fullscreen ? '退出全屏' : '全屏'}>
                  <Button
                    type="text"
                    icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    aria-label={fullscreen ? '退出全屏' : '全屏'}
                    onClick={() => setFullscreen((value) => !value)}
                  />
                </Tooltip>
              </div>
            </section>

            {json !== undefined && (
              <JobFlowJsonPanel
                key={json}
                source={json}
                allowedClazzPaths={jobs.map((job) => job.value)}
                onClose={() => setJson(undefined)}
                onApply={(value) => {
                  setName(value.name);
                  setConcurrency(value.maxConcurrency);
                  setNodes(value.nodes.map((node) => ({ id: node.id, position: node.position, data: { label: node.name, clazzPath: node.clazzPath } })));
                  setEdges(value.edges.map((edge) => ({ ...edge, id: `edge-${++sequence.current}` })));
                  setJson(undefined);
                  feedback.success('已应用到当前画布，尚未保存到服务器');
                }}
              />
            )}
            {showConfig && (
              <div className="job-flow-config-panel">
                <FaResizeHorizontal domId={configPanelId} position="left" minWidth={420} maxWidth={800} />
                <aside
                  id={configPanelId}
                  aria-label="流程配置面板"
                  style={{
                    width: 420,
                    maxWidth: '100%',
                    height: '100%',
                    boxSizing: 'border-box',
                    overflow: 'auto',
                    padding: 12,
                    borderRadius: 6,
                    background: 'var(--fa-bg-color)',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    boxShadow: token.boxShadowSecondary,
                  }}
                >
                  <div className="job-flow-config-heading">
                    <span className="job-flow-config-icon" style={{ background: token.colorPrimaryBg, color: token.colorPrimary }}>
                      <ApartmentOutlined />
                    </span>
                    <Typography.Text strong>流程配置</Typography.Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      aria-label="关闭流程配置"
                      onClick={() => setShowConfig(false)}
                      style={{ marginLeft: 'auto' }}
                    />
                  </div>
                  <Form layout="vertical">
                    <Form.Item label="流程名称" required htmlFor={`${configPanelId}-name`}>
                      <Input
                        id={`${configPanelId}-name`}
                        aria-label="流程名称"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={100}
                        placeholder="请输入流程名称"
                      />
                    </Form.Item>
                    <Form.Item label="并发上限" htmlFor={`${configPanelId}-concurrency`}>
                      <InputNumber
                        id={`${configPanelId}-concurrency`}
                        aria-label="并发上限"
                        min={1}
                        max={20}
                        precision={0}
                        value={concurrency}
                        onChange={(value) => setConcurrency(value ?? 1)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Form>
                </aside>
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0 }}>
              <ReactFlow
                colorMode={themeDark ? 'dark' : 'light'}
                nodes={nodes}
                edges={edges}
                onNodesChange={alignment.onNodesChange}
                onNodeDragStart={alignment.onDragStart}
                onNodeDragStop={alignment.onDragStop}
                onSelectionDragStart={alignment.onDragStart}
                onSelectionDragStop={alignment.onDragStop}
                onEdgesChange={onEdgesChange}
                onConnect={connect}
                onInit={(instance) => {
                  flowInstance.current = instance;
                  setZoom(instance.getZoom());
                }}
                onMove={(_, viewport) => setZoom(viewport.zoom)}
                defaultViewport={{ x: 0, y: 0, zoom: BASE_ZOOM }}
                fitView
                fitViewOptions={{ padding: 0.3, minZoom: BASE_ZOOM, maxZoom: BASE_ZOOM }}
                deleteKeyCode={['Backspace', 'Delete']}
              >
                <Background />
                {!demo && nodes.length === 0 && (
                  <Panel position="top-center" style={{ marginTop: 80 }}>
                    <Alert
                      type="info"
                      showIcon
                      title="从右上角“＋”选择已注册的任务类开始编排"
                      description="当前仅编辑页面草稿，暂存只保留在当前页面；使用顶部“保存”可存入服务器。执行与调度尚未接入。"
                    />
                  </Panel>
                )}
                <JobFlowAlignmentGuides guides={alignment.guides} />
                <Panel position="bottom-left" className="job-flow-viewport-tools">
                  <Controls orientation="horizontal" fitViewOptions={{ padding: 0.3 }} />
                  <Tooltip title="缩放比例，100% 为已设定的节点大小">
                    <Select
                      aria-label="画布缩放比例"
                      size="small"
                      style={{ width: 84 }}
                      value={Math.round((zoom / BASE_ZOOM) * 100)}
                      options={[...new Set([25, 50, 75, 100, 150, 200, Math.round((zoom / BASE_ZOOM) * 100)])]
                        .sort((a, b) => a - b)
                        .map((value) => ({ value, label: `${value}%` }))}
                      onChange={(value) => flowInstance.current?.zoomTo((value / 100) * BASE_ZOOM, { duration: 200 })}
                    />
                  </Tooltip>
                  <Tooltip title={showMiniMap ? '隐藏鹰眼图' : '显示鹰眼图'}>
                    <Button
                      size="small"
                      icon={<LayoutOutlined />}
                      aria-label="切换鹰眼图"
                      aria-pressed={showMiniMap}
                      onClick={() => setShowMiniMap((value) => !value)}
                    />
                  </Tooltip>
                  <Tooltip title="测试与操作说明">
                    <Button
                      size="small"
                      icon={<InfoCircleOutlined />}
                      aria-label="测试与操作说明"
                      aria-pressed={showTests}
                      onClick={() => setShowTests((value) => !value)}
                    />
                  </Tooltip>
                </Panel>
                {showMiniMap && (
                  <MiniMap
                    position="bottom-right"
                    pannable
                    zoomable
                    ariaLabel="流程鹰眼视图"
                    nodeColor={token.colorPrimary}
                    maskColor={themeDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.12)'}
                    style={{
                      background: token.colorBgContainer,
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: token.borderRadius,
                      width: 180,
                      height: 112,
                    }}
                  />
                )}
                {showTests && (
                  <Panel
                    position="bottom-left"
                    style={{
                      width: 280,
                      maxWidth: 'calc(100% - 32px)',
                      marginBottom: 70,
                      maxHeight: '45%',
                      overflow: 'auto',
                      borderRadius: token.borderRadiusLG,
                      background: token.colorBgContainer,
                      boxShadow: token.boxShadowSecondary,
                    }}
                  >
                    <Space orientation="vertical" size={12} style={{ padding: 12 }}>
                      <Typography.Text strong>测试与操作说明</Typography.Text>
                      <Alert
                        type="info"
                        showIcon
                        title={demo ? '模拟任务 · 仅页面预览' : '真实任务编排 · 尚未发布'}
                        description="草稿只保留在当前页面，刷新后丢失；暂存只保留在当前页面；使用顶部“保存”可存入服务器。执行与调度尚未接入。"
                      />
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <Button
                          type="primary"
                          onClick={() => {
                            const value = definition();
                            if (value) {
                              setSaved(value);
                              feedback.success('草稿已暂存于当前页面');
                            }
                          }}
                        >
                          暂存页面草稿
                        </Button>
                        <Button
                          disabled={!saved}
                          onClick={() => {
                            const value = JSON.parse(saved!);
                            setName(value.name);
                            setConcurrency(value.maxConcurrency);
                            setNodes(
                              value.nodes.map((node: FlowNode) => ({
                                id: node.id,
                                position: node.position,
                                data: { label: node.name, clazzPath: node.clazzPath },
                              })),
                            );
                            setEdges(value.edges.map((edge: Connection, index: number) => ({ ...edge, id: `restored-${index}` })));
                          }}
                        >
                          恢复暂存草稿
                        </Button>
                        <Button
                          onClick={() => {
                            const value = definition();
                            if (value) {
                              setShowConfig(false);
                              setJson(value);
                            }
                          }}
                        >
                          校验并预览 JSON
                        </Button>
                        <Button disabled title="尚未接入服务端流程执行">
                          立即执行（待接入）
                        </Button>
                      </Space>
                      <Typography.Text type="secondary">
                        从节点底部拖向下一节点顶部建立依赖；选中节点或连线后按 Delete / Backspace 删除。可重复添加同一任务。
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        流程节点直接引用任务类，不要求创建独立任务配置；若同一任务类另有 Cron 配置，跨流程与独立调度不保证互斥。
                      </Typography.Text>
                    </Space>
                  </Panel>
                )}
              </ReactFlow>
            </div>
          </div>,
          mountNode,
        )}
    </>
  );
}
