import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { CronModal, FaHref, FaResizeHorizontal, ThemeLayoutContext, useApiLoading } from '@fa/ui';
import { createPortal } from 'react-dom';
import { Alert, Button, Collapse, Form, Input, InputNumber, Popconfirm, Select, Space, Switch, Tag, Tooltip, Typography, message, theme } from 'antd';
import {
  Background,
  Controls,
  MiniMap,
  MarkerType,
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
  SafetyCertificateOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import './job-flow-preview.scss';
import type { Admin } from '@/types';
import { jobApi } from '@features/fa-admin-pages/services';
import { getFlowTaskOptions } from './jobFlowTasks';
import JobFlowTaskLibrary from './JobFlowTaskLibrary';
import useJobFlowAlignment from './useJobFlowAlignment';
import JobFlowAlignmentGuides from './JobFlowAlignmentGuides';
import JobFlowJsonPanel from './JobFlowJsonPanel';
import JobFlowPreflightPanel from './JobFlowPreflightPanel';
import JobFlowRunPanel from './JobFlowRunPanel';
import JobFlowTaskNode from './JobFlowTaskNode';
import { getFlowEntryIds, layoutFlow, parseFlowDefinition, validateFlow, type FlowNode } from './flowDefinition';

// 以验收截图中约 128px 宽的默认 150px 节点作为 100% 显示基准。
const BASE_ZOOM = 0.85;
const nodeTypes = { flowTask: JobFlowTaskNode };

const demoJobs = [
  { value: 'demo.DataPrepare', label: '示例：数据准备', name: '示例：数据准备' },
  { value: 'demo.GenerateReport', label: '示例：生成报表', name: '示例：生成报表' },
  { value: 'demo.SendNotice', label: '示例：发送通知', name: '示例：发送通知' },
];
type TaskNode = Node<{ label: string; clazzPath: string }>;
const initialNodes: TaskNode[] = demoJobs.map((job, index) => ({
  id: `demo-${job.value}`,
  position: { x: 100 + index * 240, y: 80 },
  data: { label: job.label, clazzPath: job.value },
}));
const initialEdges = [
  { id: 'demo-edge-1', source: 'demo-demo.DataPrepare', target: 'demo-demo.GenerateReport' },
  { id: 'demo-edge-2', source: 'demo-demo.GenerateReport', target: 'demo-demo.SendNotice' },
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
  const editorRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const configPanelId = useId();
  const [configWidth, setConfigWidth] = useState(420);
  const [showRun, setShowRun] = useState(false);
  const [runLogId, setRunLogId] = useState<number>();
  const [showPreflight, setShowPreflight] = useState(false);
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
  const running = useApiLoading(persistedId ? [jobApi.getUrl(`runFlow/${persistedId}`)] : []);
  const saving = useApiLoading([jobApi.getUrl('save'), jobApi.getUrl('update')]);
  const [name, setName] = useState(demo ? '示例串行任务流' : '新建任务流');
  const [cron, setCron] = useState(record?.cron ?? '0 * * * * ?');
  const [scheduleEnabled, setScheduleEnabled] = useState(record?.status ?? false);
  const [detailLogEnabled, setDetailLogEnabled] = useState(record?.detailLogEnabled ?? false);
  const [concurrency, setConcurrency] = useState(2);
  const [showLibrary, setShowLibrary] = useState(false);
  const [catalog, setCatalog] = useState<Admin.RegisteredJob[]>([]);
  const [nodes, setNodes] = useNodesState<TaskNode>(demo ? initialNodes : []);
  const alignment = useJobFlowAlignment<TaskNode>(setNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(demo ? initialEdges : []);
  const entryIds = getFlowEntryIds(nodes, edges);
  const displayNodes = nodes.map((node) => ({ ...node, type: 'flowTask', data: { ...node.data, isEntry: entryIds.has(node.id) } }));
  const [json, setJson] = useState<string>();
  const [saved, setSaved] = useState<string>();
  const [configuredJobs, setConfiguredJobs] = useState<ReturnType<typeof getFlowTaskOptions>>([]);
  const [taskError, setTaskError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const tasksLoading = useApiLoading([jobApi.getUrl('getRegisteredJobs')]);
  const jobs = demo ? demoJobs : configuredJobs;
  useEffect(() => {
    if (!open || demo) return;
    let cancelled = false;
    setTaskError(false);
    setConfiguredJobs([]);
    Promise.all([jobApi.getRegisteredJobs(), record ? jobApi.getById(record.id) : Promise.resolve(undefined)])
      .then(([res, detail]) => {
        if (cancelled) return;
        setCatalog(res.data);
        const options = getFlowTaskOptions(res.data.map(task => ({ value: task.clazzPath, label: task.name })));
        setConfiguredJobs(options);
        if (detail) setScheduleEnabled(detail.data.status ?? false);
        if (detail && !loadedRecord.current) {
          loadedRecord.current = true;
          const definition = parseFlowDefinition(
            detail.data.flowDefinition ?? '',
            options.map((job) => job.value),
          );
          setName(detail.data.jobName);
          setCron(detail.data.cron ?? '0 * * * * ?');
          setDetailLogEnabled(detail.data.detailLogEnabled ?? false);
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
    if (!cron.trim()) { feedback.warning('请输入 Cron 表达式'); setShowConfig(true); return; }
    const values = { detailLogEnabled, jobName: name.trim(), jobType: 1, flowDefinition: source, cron: cron.trim(), clazzPath: '' };
    if (persistedId) await jobApi.update(persistedId, { id: persistedId, ...values });
    else {
      const res = await jobApi.save({ ...values, status: false });
      setPersistedId(res.data.id);
    }
    feedback.success('流程已保存，可返回列表启用定时调度');
    fetchFinish?.();
  }

  return (
    <>
      {contextHolder}
      {!demo && record ? (
        <FaHref
          icon={<ApartmentOutlined />}
          text="编排"
          onClick={() => {
            loadedRecord.current = false;
            setOpen(true);
          }}
        />
      ) : (
        <Button
          onClick={() => {
            loadedRecord.current = false;
            setOpen(true);
          }}
        >
          {demo ? '流程编排预览' : '新建任务流'}
        </Button>
      )}
      <span ref={anchorRef} style={{ display: 'none' }} />
      {open &&
        mountNode &&
        createPortal(
          <div ref={editorRef} className={`job-flow-editor fa-full-content ${fullscreen ? 'job-flow-editor--fullscreen' : ''}`}>
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
                      setShowPreflight(false);
                      setShowRun(false);
                      setShowLibrary(false);
                      setShowConfig((value) => !value);
                    }}
                  />
                </Tooltip>
                <Tooltip title="任务库">
                  <Button type="text" icon={<PlusOutlined />} aria-label="打开任务库" aria-pressed={showLibrary} onClick={() => {
                    setJson(undefined); setShowConfig(false); setShowPreflight(false); setShowRun(false); setShowLibrary(value => !value);
                  }} />
                </Tooltip>
                <Tooltip title="自动布局">
                  <Button type="text" icon={<ApartmentOutlined />} aria-label="自动布局" onClick={() => {
                          const error = validateFlow(flowNodes(), edges);
                          if (error) {
                            feedback.warning(error);
                            return;
                          }
                          const positions = new Map(layoutFlow(flowNodes(), edges).map((node) => [node.id, node.position]));
                          setNodes((current) => current.map((node) => ({ ...node, position: positions.get(node.id)! })));
                  }} />
                </Tooltip>
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
                        setShowPreflight(false);
                        setShowRun(false);
                        setShowLibrary(false);
                        setJson(value);
                      }
                    }}
                  />
                </Tooltip>
                <span className="job-flow-toolbar-divider" aria-hidden="true" />
                {!demo && (
                  <>
                    <Popconfirm
                      title="执行已保存的流程？"
                      description={
                        <div style={{ width: 280, maxWidth: 'calc(100vw - 96px)', whiteSpace: 'normal' }}>
                          <div>将实际运行任务，可能产生业务数据。</div>
                          <Typography.Text type="secondary">未保存的修改不参与本次执行。</Typography.Text>
                        </div>
                      }
                      placement="bottomRight"
                      okText="执行"
                      cancelText="取消"
                      disabled={!persistedId || running}
                      onConfirm={async () => {
                        if (!persistedId) return;
                        const response = await jobApi.runFlow(persistedId);
                        setRunLogId(response.data.log.id);
                        setJson(undefined);
                        setShowConfig(false);
                        setShowPreflight(false);
                        setShowLibrary(false);
                        setShowRun(true);
                        fetchFinish?.();
                      }}
                    >
                      <Button type="text" disabled={!persistedId} loading={running} icon={<PlayCircleOutlined />}>
                        执行
                      </Button>
                    </Popconfirm>
                    <Tooltip title="流程运行记录">
                      <Button
                        type="text"
                        disabled={!persistedId}
                        icon={<HistoryOutlined />}
                        aria-label="流程运行记录"
                        onClick={() => {
                          setRunLogId(undefined);
                          setJson(undefined);
                          setShowConfig(false);
                          setShowPreflight(false);
                          setShowLibrary(false);
                          setShowRun((value) => !value);
                        }}
                      />
                    </Tooltip>
                  </>
                )}
                {!demo && (
                  <Tooltip title="检查服务器已保存定义；不执行任务">
                    <Button
                      type="text"
                      disabled={!persistedId}
                      icon={<SafetyCertificateOutlined />}
                      aria-label="运行前检查"
                      onClick={() => {
                        setJson(undefined);
                        setShowConfig(false);
                        setShowRun(false);
                        setShowLibrary(false);
                        setShowPreflight((value) => !value);
                      }}
                    >
                      预检
                    </Button>
                  </Tooltip>
                )}
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

            {showLibrary && <JobFlowTaskLibrary
              tasks={demo ? demoJobs.map(job => ({ clazzPath: job.value, name: job.name ?? job.label, group: '页面示例', description: '', tags: [], sort: 0, deprecated: false })) : catalog}
              loading={tasksLoading} failed={taskError} full={nodes.length >= 100}
              counts={Object.fromEntries(jobs.map(job => [job.value, nodes.filter(node => node.data.clazzPath === job.value).length]))}
              onRefresh={() => setRefresh(value => value + 1)} onClose={() => setShowLibrary(false)}
              onAdd={task => setNodes(current => {
                if (current.length >= 100) return current;
                const origin = flowInstance.current?.screenToFlowPosition({ x: (editorRef.current?.getBoundingClientRect().left ?? 0) + 180, y: (editorRef.current?.getBoundingClientRect().top ?? 0) + 180 }) ?? { x: 100, y: 100 };
                let position = origin;
                while (current.some(node => Math.abs(node.position.x - position.x) < 40 && Math.abs(node.position.y - position.y) < 40)) position = { x: position.x + 40, y: position.y + 60 };
                return [...current, { id: `node-${crypto.randomUUID()}`, position, data: { label: task.name, clazzPath: task.clazzPath } }];
              })}
            />}
            {showRun && persistedId && (
              <JobFlowRunPanel key={runLogId ?? 'history'} jobId={persistedId} initialLogId={runLogId} onClose={() => setShowRun(false)} />
            )}
            {showPreflight && persistedId && (
              <JobFlowPreflightPanel
                jobId={persistedId}
                selectedNodeId={nodes.find((node) => node.selected)?.id}
                onClose={() => setShowPreflight(false)}
                onLocateNode={(id, panelWidth) => {
                  const instance = flowInstance.current;
                  const node = instance?.getNode(id);
                  const area = editorRef.current?.getBoundingClientRect();
                  if (!instance || !node || !area) {
                    feedback.info('该节点已不在当前画布，请保存后重新预检');
                    return;
                  }
                  setNodes((current) => current.map((item) => ({ ...item, selected: item.id === id })));
                  setEdges((current) => current.map((edge) => ({ ...edge, selected: false })));
                  const { zoom } = instance.getViewport();
                  const x = node.position.x + (node.measured?.width ?? 150) / 2;
                  const y = node.position.y + (node.measured?.height ?? 40) / 2;
                  void instance.setViewport(
                    { x: Math.max(0, area.width - panelWidth - 36) / 2 - x * zoom, y: area.height / 2 - y * zoom, zoom },
                    { duration: 300 },
                  );
                }}
              />
            )}
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
                <FaResizeHorizontal domId={configPanelId} position="left" minWidth={360} maxWidth={800} onWidthChange={setConfigWidth} />
                <aside
                  id={configPanelId}
                  aria-label="流程配置面板"
                  style={{
                    width: configWidth,
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
                    {!demo && <Form.Item
                      label={<Space>定时调度<Tag color={scheduleEnabled ? 'processing' : undefined}>{scheduleEnabled ? '已启用' : '已暂停'}</Tag></Space>}
                      htmlFor={`${configPanelId}-cron`}
                      extra={scheduleEnabled ? '请先在任务列表暂停调度，再修改 Cron；保存编排不会停止当前运行。' : '保存后在任务列表启用调度；暂停调度仅影响未来触发。'}
                    >
                      <Input id={`${configPanelId}-cron`} aria-label="流程 Cron 表达式" value={cron} disabled={scheduleEnabled}
                        onChange={event => setCron(event.target.value)} placeholder="0 * * * * ?" maxLength={100}
                        addonAfter={!scheduleEnabled && <CronModal key={cron} initialValue={cron} onChange={value => setCron(value ?? '')} />} />
                    </Form.Item>}
                    <Form.Item
                      label="记录详细日志"
                      htmlFor={`${configPanelId}-detail-log`}
                      extra="保存后对下一轮生效，为流程及节点记录详细日志；运行中的日志配置保持启动时快照。"
                    >
                      <Switch
                        id={`${configPanelId}-detail-log`}
                        checked={detailLogEnabled}
                        onChange={setDetailLogEnabled}
                        checkedChildren="开启"
                        unCheckedChildren="关闭"
                      />
                    </Form.Item>
                  </Form>
                </aside>
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0 }}>
              <ReactFlow
                colorMode={themeDark ? 'dark' : 'light'}
                nodes={displayNodes}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={{
                  markerEnd: { type: MarkerType.ArrowClosed, color: token.colorTextSecondary },
                  style: { stroke: token.colorTextSecondary },
                }}
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
                      description="当前仅编辑页面草稿，暂存只保留在当前页面；使用顶部“保存”可存入服务器。已保存流程可手动执行，也可在任务列表启用 Cron 调度。"
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
                  <Tooltip title="操作指南">
                    <Button
                      size="small"
                      icon={<InfoCircleOutlined />}
                      aria-label="操作指南"
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
                      width: 360,
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
                      <Typography.Text strong>操作指南</Typography.Text>
                      <Alert
                        type="info"
                        showIcon
                        title={demo ? '模拟任务 · 仅页面预览' : '流程编排'}
                        description={
                          demo
                            ? '示例仅用于页面预览，不保存到服务器或执行任务；刷新后草稿丢失。'
                            : '暂存只保留在当前页面，刷新后丢失；顶部“保存”可存入服务器，已保存流程可手动执行或在列表启用 Cron 调度。'
                        }
                      />
                      {!demo && <Collapse size="small" ghost style={{ width: '100%' }} defaultActiveKey={['create']} items={[
                        { key: 'create', label: '1. 添加任务与建立依赖', children: '顶部“＋”打开任务库，可按分组、名称、描述、标签或类名搜索。点击卡片添加；节点直接引用后台注册类，无需另建普通任务。连线从右侧输出到左侧输入，无前驱节点标记为入口。' },
                        { key: 'save', label: '2. 保存、预检与执行', children: '在配置中设置并发上限与日志开关，然后保存。预检和执行都使用服务器已保存的定义，不包含画布未保存修改；暂存只是当前页面草稿，刷新后丢失。执行会真实调用业务任务，同一轮中的同类任务串行。' },
                        { key: 'schedule', label: '3. 定时调度与停止', children: '配置 Cron 并保存后，在任务列表启用调度；修改已启用的 Cron 前先暂停。暂停只影响未来触发；运行详情的“停止本轮”禁止新节点启动，已运行任务继续收尾，不撤销业务影响，也不暂停未来 Cron。' },
                        { key: 'logs', label: '4. 历史记录与日志排查', children: '历史记录支持查询和分页，点击查看运行详情。选择时间线卡片与运行图双向定位；顶部编排日志记录调度过程，卡片日志图标查看该节点业务日志。须在执行前开启并保存详细日志，旧轮次不补生成。' },
                        { key: 'unknown', label: '5. 失败或未确认怎么办', children: '失败会阻断依赖后代，独立分支可继续。执行中停滞可点击“核对状态”同步已提交结果，不会重跑业务。未确认不能当作成功，仍阻止同一流程再次启动；先核查业务实际结果，目前尚无人工解除入口，不要通过修改数据库状态绕过。' },
                      ]} />}
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
                              setShowPreflight(false);
                              setShowRun(false);
                              setShowLibrary(false);
                        setJson(value);
                            }
                          }}
                        >
                          校验并预览 JSON
                        </Button>
                      </Space>
                      <Typography.Text type="secondary">
                        从节点右侧拖向下一节点左侧建立依赖；选中节点或连线后按 Delete / Backspace 删除。可重复添加同一任务。
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
