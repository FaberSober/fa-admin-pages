import { expect, it } from 'vitest';
import type { Admin } from '@/types';
import { buildRunGraph, runNodeStates } from './flowRunGraphModel';
const run = () => ({ log: { id: 1 }, definition: { nodes: [
  { id: 'a', name: '旧名称', clazzPath: 'SameTask', position: { x: -80, y: 25 } },
  { id: 'b', name: '另一个节点', clazzPath: 'SameTask', position: { x: 240, y: 80 } },
  { id: 'missing', name: '无记录', position: { x: 500, y: 0 } },
], edges: [{ source: 'a', target: 'b' }] }, nodes: [{ nodeId: 'a', status: 50 }, { nodeId: 'b', status: 60 }] }) as unknown as Admin.JobFlowRun;
it('preserves frozen positions and maps same-class nodes by independent node IDs', () => {
  const graph = buildRunGraph(run(), 'b');
  expect(graph.nodes[0].position).toEqual({ x: -80, y: 25 });
  expect(graph.nodes[0].data).toMatchObject({ label: '旧名称', status: 50, entry: true });
  expect(graph.nodes[1]).toMatchObject({ selected: true, data: { status: 60, entry: false } });
  expect(runNodeStates[50]).toBe('失败'); expect(runNodeStates[60]).toBe('已阻断');
});
it('does not invent success when a historical node has no execution record', () => {
  expect(buildRunGraph(run()).nodes[2].data.status).toBeUndefined();
});
it('does not mutate the run and disables graph editing', () => {
  const value = run(); const before = JSON.stringify(value);
  const graph = buildRunGraph(value);
  expect(JSON.stringify(value)).toBe(before);
  expect(graph.nodes.every(node => node.draggable === false && node.connectable === false && node.deletable === false)).toBe(true);
});
