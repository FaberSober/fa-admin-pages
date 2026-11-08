import { expect, it } from 'vitest';
import { getFlowTaskOptions } from './jobFlowTasks';
import { parseFlowDefinition } from './flowDefinition';

it('从注册类生成候选项，无需数据库记录或任务 ID', () => {
  const options = getFlowTaskOptions([
    { value: 'com.example.Report', label: '报表' },
    { value: 'com.other.Report', label: '报表' },
  ]);
  expect(options.map((option) => option.value)).toEqual(['com.example.Report', 'com.other.Report']);
  expect(options[0].label).toContain('com.example.Report');
  expect(options[0].name).toBe('报表');
});
it('过滤无效类路径及重复注册，缺少名称时使用类路径', () => {
  expect(
    getFlowTaskOptions([
      { value: 1, label: '旧任务ID' },
      { value: ' ', label: '空路径' },
      { value: 'com.example.Job', label: null },
      { value: 'com.example.Job', label: '重复注册' },
    ]),
  ).toEqual([{ value: 'com.example.Job', name: 'com.example.Job', label: 'com.example.Job · com.example.Job' }]);
});
it('JSON 仅接受注册类，拒绝已卸载类和旧 jobId', () => {
  const source = {
    schemaVersion: 1,
    name: '编排',
    maxConcurrency: 1,
    nodes: [{ id: 'a', clazzPath: 'com.example.Report', name: '报表', position: { x: 10, y: 20 } }],
    edges: [],
  };
  expect(parseFlowDefinition(JSON.stringify(source), ['com.example.Report']).nodes[0].clazzPath).toBe('com.example.Report');
  expect(() => parseFlowDefinition(JSON.stringify(source), [])).toThrow('已注册');
  expect(() =>
    parseFlowDefinition(JSON.stringify({ ...source, nodes: [{ ...source.nodes[0], clazzPath: undefined, jobId: 42 }] }), ['com.example.Report']),
  ).toThrow('clazzPath');
});
