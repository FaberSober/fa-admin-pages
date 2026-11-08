import { describe, expect, it } from 'vitest';
import { parseFlowDefinition } from './flowDefinition';
const definition = () => ({
  schemaVersion: 1,
  name: '测试流程',
  maxConcurrency: 2,
  nodes: [
    { id: 'a', clazzPath: 'com.example.Job', name: '准备', position: { x: 10, y: 20 } },
    { id: 'b', clazzPath: 'com.example.Job', name: '再次准备', position: { x: 30, y: 40 } },
  ],
  edges: [{ source: 'a', target: 'b' }],
});
const parse = (value: unknown) => parseFlowDefinition(JSON.stringify(value), ['com.example.Job']);
describe('流程 JSON 回填校验', () => {
  it('保留独立节点、重复任务引用、位置和并发设置，丢弃未知配置', () => {
    const input = definition();
    expect(parse({ ...input, status: 'SUCCESS' })).toEqual(input);
    expect(parse(JSON.parse(JSON.stringify(input)))).toEqual(input);
  });
  it.each([
    null,
    [],
    {},
    { ...definition(), schemaVersion: 2 },
    { ...definition(), name: '' },
    { ...definition(), maxConcurrency: 0 },
    { ...definition(), maxConcurrency: 1.5 },
    { ...definition(), maxConcurrency: 21 },
    { ...definition(), nodes: [] },
    { ...definition(), edges: null },
  ])('拒绝非法结构或配置 %j', (input) => {
    expect(() => parse(input)).toThrow();
  });
  it('拒绝不可用任务、异常坐标及重复节点 ID', () => {
    const input = definition();
    input.nodes[0].clazzPath = 'com.example.Missing';
    expect(() => parse(input)).toThrow('已注册');
    input.nodes[0].clazzPath = 'com.example.Job';
    input.nodes[0].position.x = 1000001;
    expect(() => parse(input)).toThrow('坐标');
    input.nodes[0].position.x = 0;
    input.nodes[1].id = 'a';
    expect(() => parse(input)).toThrow('唯一');
  });
  it('拒绝环路、失效端点及超出大小限制的定义', () => {
    const input = definition();
    input.edges.push({ source: 'b', target: 'a' });
    expect(() => parse(input)).toThrow('循环');
    input.edges = [{ source: 'a', target: 'missing' }];
    expect(() => parse(input)).toThrow('不存在');
    expect(() => parseFlowDefinition(' '.repeat(256 * 1024 + 1), ['com.example.Job'])).toThrow('256KB');
    expect(() => parseFlowDefinition('{', ['com.example.Job'])).toThrow('格式');
  });
});
