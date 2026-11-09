import type { Edge, Node } from '@xyflow/react';
import type { Admin } from '@/types';

export const runNodeStates: Record<number, string> = {
  0: '等待执行', 10: '待调度', 20: '启动中', 30: '执行中', 40: '成功',
  50: '失败', 60: '已阻断', 70: '已停止', 80: '未确认',
};
export type RunGraphNode = Node<{ label: string; clazzPath: string; status?: number; entry: boolean; activate?: () => void }>;
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};

/** 只读取本轮冻结定义，不能用编辑画布或任务类路径替代节点 ID。 */
export function buildRunGraph(run: Admin.JobFlowRun, selectedNodeId?: string): { nodes: RunGraphNode[]; edges: Edge[] } {
  const definitions = Array.isArray(run.definition.nodes) ? run.definition.nodes : [];
  const links = Array.isArray(run.definition.edges) ? run.definition.edges : [];
  const records = new Map(run.nodes.map(node => [node.nodeId, node]));
  const ids = new Set(definitions.map(item => object(item).id).filter((id): id is string => typeof id === 'string'));
  const edges = links.flatMap((item, index) => {
    const edge = object(item);
    return typeof edge.source === 'string' && typeof edge.target === 'string' && ids.has(edge.source) && ids.has(edge.target)
      ? [{ id: `run-edge-${index}`, source: edge.source, target: edge.target }] : [];
  });
  const targets = new Set(edges.map(edge => edge.target));
  const nodes = definitions.flatMap((item, index): RunGraphNode[] => {
    const node = object(item);
    if (typeof node.id !== 'string') return [];
    const record = records.get(node.id);
    const position = object(node.position);
    return [{
      id: node.id, type: 'runTask', selected: selectedNodeId === node.id,
      position: { x: typeof position.x === 'number' && Number.isFinite(position.x) ? position.x : index * 240, y: typeof position.y === 'number' && Number.isFinite(position.y) ? position.y : 0 },
      data: { label: typeof node.name === 'string' ? node.name : node.id, clazzPath: typeof node.clazzPath === 'string' ? node.clazzPath : '', status: record?.status, entry: !targets.has(node.id) },
      draggable: false, connectable: false, deletable: false,
    }];
  });
  return { nodes, edges };
}
