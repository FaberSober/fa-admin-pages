import { useContext } from 'react';
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, type NodeProps } from '@xyflow/react';
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
      <Background /><Controls showInteractive={false} />
    </ReactFlow></ReactFlowProvider>
  </section>;
}
