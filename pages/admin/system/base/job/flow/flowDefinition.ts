export interface FlowNode {
  id: string;
  jobId: number;
  name: string;
  position: { x: number; y: number };
}

export interface FlowEdge {
  source: string;
  target: string;
}

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

export interface FlowDefinition {
  schemaVersion: 1;
  name: string;
  maxConcurrency: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

/** 从不可信 JSON 生成可回填的数据，只保留当前版本支持的字段。 */
export function parseFlowDefinition(source: string, allowedJobIds: readonly number[]): FlowDefinition {
  if (new TextEncoder().encode(source).length > 256 * 1024) throw new Error('流程定义不能超过 256KB');
  let input: unknown;
  try {
    input = JSON.parse(source);
  } catch {
    throw new Error('JSON 格式无效，请检查语法');
  }
  const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('流程定义、节点及连线必须为对象');
    return value as Record<string, unknown>;
  };
  const text = (value: unknown, label: string): string => {
    if (typeof value !== 'string' || !value.trim() || value.length > 100) throw new Error(`${label}须为 1–100 字符的非空文本`);
    return value;
  };
  const data = object(input);
  if (data.schemaVersion !== 1) throw new Error('仅支持 schemaVersion=1 的流程定义');
  const name = text(data.name, '流程名称').trim();
  if (typeof data.maxConcurrency !== 'number' || !Number.isInteger(data.maxConcurrency) || data.maxConcurrency < 1 || data.maxConcurrency > 20)
    throw new Error('并发上限须为 1–20 的整数');
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error('nodes 和 edges 必须为数组');
  if (data.nodes.length > 100 || data.edges.length > 500) throw new Error('最多支持 100 个节点、500 条连线');
  const nodes = data.nodes.map((value): FlowNode => {
    const node = object(value);
    const id = text(node.id, '节点 ID');
    if (typeof node.jobId !== 'number' || !Number.isSafeInteger(node.jobId) || !allowedJobIds.includes(node.jobId))
      throw new Error(`节点 ${id} 引用了不可用的普通任务`);
    const position = object(node.position);
    const coordinate = (value: unknown): number => {
      if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1000000) throw new Error('节点坐标须为绝对值不超过 1000000 的有限数字');
      return value;
    };
    return { id, jobId: node.jobId, name: text(node.name, '节点名称'), position: { x: coordinate(position.x), y: coordinate(position.y) } };
  });
  const edges = data.edges.map((value): FlowEdge => {
    const edge = object(value);
    return { source: text(edge.source, '连线起点'), target: text(edge.target, '连线终点') };
  });
  const error = validateFlow(nodes, edges);
  if (error) throw new Error(error);
  return { schemaVersion: 1, name, maxConcurrency: data.maxConcurrency, nodes, edges };
}
