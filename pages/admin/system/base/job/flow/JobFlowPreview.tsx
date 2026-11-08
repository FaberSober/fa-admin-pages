import { useContext, useId, useLayoutEffect, useRef, useState } from 'react';
import { FaResizeHorizontal, ThemeLayoutContext } from '@fa/ui';
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
import useJobFlowAlignment from './useJobFlowAlignment';
import JobFlowAlignmentGuides from './JobFlowAlignmentGuides';
import JobFlowJsonPanel from './JobFlowJsonPanel';
import { layoutFlow, validateFlow, type FlowNode } from './flowDefinition';

// 以验收截图中约 128px 宽的默认 150px 节点作为 100% 显示基准。
const BASE_ZOOM = 0.85;

const demoJobs = [
  { value: 1, label: '示例：数据准备' },
  { value: 2, label: '示例：生成报表' },
  { value: 3, label: '示例：发送通知' },
];
type TaskNode = Node<{ label: string; jobId: number }>;
const initialNodes: TaskNode[] = demoJobs.map((job, index) => ({
  id: `demo-${job.value}`,
  position: { x: 100, y: 40 + index * 150 },
  data: { label: job.label, jobId: job.value },
}));
const initialEdges = [
  { id: 'demo-edge-1', source: 'demo-1', target: 'demo-2' },
  { id: 'demo-edge-2', source: 'demo-2', target: 'demo-3' },
];

/** 独立的页面原型，不提交配置或触发真实任务。 */
export default function JobFlowPreview() {
  return (
    <ReactFlowProvider>
      <JobFlowEditor />
    </ReactFlowProvider>
  );
}

function JobFlowEditor() {
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
  const [name, setName] = useState('示例串行任务流');
  const [concurrency, setConcurrency] = useState(2);
  const [jobId, setJobId] = useState(1);
  const [nodes, setNodes] = useNodesState<TaskNode>(initialNodes);
  const alignment = useJobFlowAlignment<TaskNode>(setNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [json, setJson] = useState<string>();
  const [saved, setSaved] = useState<string>();
  const sequence = useRef(0);
  const [feedback, contextHolder] = message.useMessage();
  const flowNodes = (): FlowNode[] => nodes.map((node) => ({ id: node.id, jobId: node.data.jobId, name: node.data.label, position: node.position }));

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
    return JSON.stringify(
      { schemaVersion: 1, name: name.trim(), maxConcurrency: concurrency, nodes: flowNodes(), edges: edges.map(({ source, target }) => ({ source, target })) },
      null,
      2,
    );
  }

  return (
    <>
      {contextHolder}
      <Button onClick={() => setOpen(true)}>流程编排预览</Button>
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
                <span className="job-flow-toolbar-status">模拟编排</span>
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
                  title="添加普通任务节点"
                  trigger="click"
                  content={
                    <Space orientation="vertical">
                      {' '}
                      <Select aria-label="选择普通任务" value={jobId} options={demoJobs} onChange={setJobId} style={{ width: 180 }} />
                      <Button
                        icon={<PlusOutlined />}
                        disabled={nodes.length >= 100}
                        onClick={() => {
                          const job = demoJobs.find((item) => item.value === jobId)!;
                          setNodes((current) => [
                            ...current,
                            { id: `node-${crypto.randomUUID()}`, position: { x: 360, y: 40 }, data: { label: job.label, jobId } },
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
                allowedJobIds={demoJobs.map((job) => job.value)}
                onClose={() => setJson(undefined)}
                onApply={(value) => {
                  setName(value.name);
                  setConcurrency(value.maxConcurrency);
                  setNodes(value.nodes.map((node) => ({ id: node.id, position: node.position, data: { label: node.name, jobId: node.jobId } })));
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
                      <Alert type="info" showIcon title="模拟任务 · 仅页面预览" description="草稿只保留在当前页面，刷新后丢失；不会保存到服务器或执行任务。" />
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
                              value.nodes.map((node: FlowNode) => ({ id: node.id, position: node.position, data: { label: node.name, jobId: node.jobId } })),
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
                      <Typography.Text type="secondary">普通任务暂停仅停止独立 Cron，不阻止未来流程调用；跨流程与独立调度不保证互斥。</Typography.Text>
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
