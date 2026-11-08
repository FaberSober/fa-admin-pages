import { describe, expect, it } from 'vitest';
import { layoutFlow, validateFlow, type FlowNode } from './flowDefinition';
const nodes: FlowNode[] = ['a', 'b', 'c'].map((id) => ({ id, clazzPath: 'com.example.Job', name: id, position: { x: 0, y: 0 } }));
describe('流程页面 DAG 校验', () => {
  it('允许多入口汇合和重复任务引用', () => {
    expect(
      validateFlow(nodes, [
        { source: 'a', target: 'c' },
        { source: 'b', target: 'c' },
      ]),
    ).toBeUndefined();
  });
  it('拒绝空流程、重复 ID、无效端点、自环、重复边及环', () => {
    expect(validateFlow([], [])).toBeTruthy();
    expect(validateFlow([nodes[0], nodes[0]], [])).toBeTruthy();
    expect(validateFlow(nodes, [{ source: 'a', target: 'missing' }])).toBeTruthy();
    expect(validateFlow(nodes, [{ source: 'a', target: 'a' }])).toBeTruthy();
    expect(
      validateFlow(nodes, [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'b' },
      ]),
    ).toBeTruthy();
    expect(
      validateFlow(nodes, [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'a' },
      ]),
    ).toBeTruthy();
  });
  it('限制节点及连线数量', () => {
    expect(
      validateFlow(
        Array.from({ length: 101 }, (_, i) => ({ ...nodes[0], id: String(i) })),
        [],
      ),
    ).toBeTruthy();
    expect(
      validateFlow(
        nodes,
        Array.from({ length: 501 }, () => ({ source: 'a', target: 'b' })),
      ),
    ).toBeTruthy();
  });
  it('按最长前驱链布局，保留独立入口', () => {
    const result = layoutFlow(nodes, [
      { source: 'a', target: 'c' },
      { source: 'b', target: 'c' },
    ]);
    expect(result[0].position.y).toBe(result[1].position.y);
    expect(result[0].position.x).not.toBe(result[1].position.x);
    expect(result[2].position.y).toBeGreaterThan(result[0].position.y);
  });
});
