export interface FlowNode {
  id: string;
  jobId: number;
  name: string;
  position: { x: number; y: number };
}

export interface FlowEdge { source: string; target: string }

/** 页面原型约束；正式保存时仍需服务端独立校验。 */
export function validateFlow(nodes: FlowNode[], edges: FlowEdge[]): string | undefined {
  if (!nodes.length) return '请至少添加一个任务节点';
  if (nodes.length > 100 || edges.length > 500) return '最多支持 100 个节点、500 条连线';
  const ids = new Set(nodes.map((node) => node.id));
  if (ids.size !== nodes.length || nodes.some((node) => !node.id)) return '节点 ID 必须非空且唯一';
  const pairs = new Set<string>();
  const degree = new Map(nodes.map((node) => [node.id, 0]));
  const children = new Map(nodes.map((node) => [node.id, [] as string[]]));
  for (const edge of edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) return '连线引用了不存在的节点';
    if (edge.source === edge.target) return '节点不能连接自身';
    const key = JSON.stringify([edge.source, edge.target]);
    if (pairs.has(key)) return '不能重复连接相同节点';
    pairs.add(key);
    degree.set(edge.target, degree.get(edge.target)! + 1);
    children.get(edge.source)!.push(edge.target);
  }
  const queue = nodes.filter((node) => degree.get(node.id) === 0).map((node) => node.id);
  let visited = 0;
  while (queue.length) {
    const id = queue.shift()!;
    visited++;
    for (const child of children.get(id)!) {
      degree.set(child, degree.get(child)! - 1);
      if (degree.get(child) === 0) queue.push(child);
    }
  }
  return visited === nodes.length ? undefined : '流程存在循环依赖，请删除形成环路的连线';
}

/** 按依赖层级布局，保留同层节点的稳定顺序。调用前应通过 DAG 校验。 */
export function layoutFlow(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const levels = new Map(nodes.map((node) => [node.id, 0]));
  for (let round = 0; round < nodes.length; round++) {
    for (const edge of edges) levels.set(edge.target, Math.max(levels.get(edge.target)!, levels.get(edge.source)! + 1));
  }
  const rows = new Map<number, number>();
  return nodes.map((node) => {
    const level = levels.get(node.id)!;
    const row = rows.get(level) ?? 0;
    rows.set(level, row + 1);
    return { ...node, position: { x: row * 240 + 40, y: level * 150 + 40 } };
  });
}
