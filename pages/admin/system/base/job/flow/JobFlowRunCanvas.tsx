import { useContext, useEffect } from 'react';
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, useReactFlow, useNodesInitialized, useStore, type NodeProps } from '@xyflow/react';
import { theme } from 'antd';
import { ThemeLayoutContext } from '@fa/ui';
import type { Admin } from '@/types';
import { buildRunGraph, runNodeStates, type RunGraphNode } from './flowRunGraphModel';
import '@xyflow/react/dist/style.css';
import './job-flow-run-graph.scss';

function RunTask({ data, selected }: NodeProps<RunGraphNode>) {
  const { token } = theme.useToken();
  const status = data.status;
  const color = status === 40 ? token.colorSuccess : status === 50 ? token.colorError
    : status === 60 || status === 80 ? token.colorWarning : status === 20 || status === 30 ? token.colorPrimary : token.colorTextSecondary;
  return <div className="job-flow-run-node" style={{ background: token.colorBgContainer, borderColor: selected ? token.colorPrimary : color, boxShadow: selected ? `0 0 0 2px ${token.colorPrimaryBg}` : undefined }}>
    <Handle type="target" position={Position.Left} isConnectable={false} />
    <button type="button" onClick={data.activate} title={data.clazzPath} style={{ color: token.colorText }}>
      <strong>{data.label}</strong>
      <span style={{ color }}><i style={{ background: color }} />{status === undefined ? '未知状态' : runNodeStates[status] ?? '未知状态'}{data.entry && <small>入口</small>}</span>
    </button>
    <Handle type="source" position={Position.Right} isConnectable={false} />
  </div>;
}
const nodeTypes = { runTask: RunTask };

export default function JobFlowRunCanvas({ run, selectedNodeId, onSelect }: {
  run: Admin.JobFlowRun; selectedNodeId?: string; onSelect: (nodeId: string) => void;
}) {
  const { themeDark } = useContext(ThemeLayoutContext);
  const { token } = theme.useToken();
  const graph = buildRunGraph(run, selectedNodeId);
  return <section className="job-flow-run-graph" style={{ height: '100%', minHeight: 300, borderColor: token.colorBorder }} aria-label="历史流程运行图">
    <ReactFlowProvider key={run.log.id}><ReactFlow nodes={graph.nodes.map(node => ({ ...node, data: { ...node.data, activate: () => onSelect(node.id) } }))}
      edges={graph.edges.map(edge => ({ ...edge, markerEnd: { type: MarkerType.ArrowClosed, color: token.colorTextSecondary }, style: { stroke: token.colorTextSecondary } }))}
      nodeTypes={nodeTypes} colorMode={themeDark ? 'dark' : 'light'} fitView fitViewOptions={{ padding: 0.25 }}
      nodesDraggable={false} nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null} minZoom={0.1} maxZoom={2}>
      <SelectedNodeFocus nodeId={selectedNodeId} /><Background /><Controls showInteractive={false} />
    </ReactFlow></ReactFlowProvider>
  </section>;
}

/** 定位屏幕外节点，保持用户当前缩放。 */
function SelectedNodeFocus({ nodeId }: { nodeId?: string }) {
  const { getNode, getViewport, setCenter } = useReactFlow();
  const initialized = useNodesInitialized();
  const width = useStore(state => state.width);
  const height = useStore(state => state.height);
  useEffect(() => {
    if (!nodeId || !initialized) return;
    const node = getNode(nodeId);
    if (!node) return;
    const viewport = getViewport();
    const w = node.measured?.width ?? 180, h = node.measured?.height ?? 60;
    const x = node.position.x * viewport.zoom + viewport.x, y = node.position.y * viewport.zoom + viewport.y;
    if (x < 16 || y < 16 || x + w * viewport.zoom > width - 16 || y + h * viewport.zoom > height - 16)
      void setCenter(node.position.x + w / 2, node.position.y + h / 2, { zoom: viewport.zoom, duration: 250 });
  }, [nodeId, initialized, width, height, getNode, getViewport, setCenter]);
  return null;
}
