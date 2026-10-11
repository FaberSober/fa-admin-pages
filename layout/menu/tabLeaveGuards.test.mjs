import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const { outputText } = ts.transpileModule(await readFile(new URL('./tabLeaveGuards.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext } });
const { createTabLeaveGuards } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('batch close cancellation performs no removal or navigation', async () => {
  const guards = createTabLeaveGuards();
  const calls = [];
  guards.register('a', async () => { calls.push('a'); return true; });
  guards.register('b', async () => { calls.push('b'); return false; });
  await guards.run(['a', 'b'], () => { calls.push('remove/navigate'); });
  assert.deepEqual(calls, ['a', 'b']);
});

test('guards belong to owner tab even while another tab is active', async () => {
  const guards = createTabLeaveGuards();
  let calls = 0;
  let actions = 0;
  guards.register('hidden', async () => { calls++; return false; });
  await guards.run(['active'], () => { actions++; });
  assert.equal(calls, 0);
  assert.equal(actions, 1);
  await guards.run(['hidden'], () => { actions++; });
  assert.equal(calls, 1);
  assert.equal(actions, 1);
});

test('unregister leaves other guards intact and confirmed reload can run', async () => {
  const guards = createTabLeaveGuards();
  let actions = 0;
  const remove = guards.register('tab', async () => false);
  const other = guards.register('tab', async () => false);
  remove();
  await guards.run(['tab'], () => { actions++; });
  assert.equal(actions, 0);
  other();
  await guards.run(['tab'], () => { actions++; });
  assert.equal(actions, 1);
});

test('duplicate requests and duplicate keys do not repeat confirmations', async () => {
  const guards = createTabLeaveGuards();
  let approve;
  let calls = 0;
  let actions = 0;
  guards.register('tab', () => { calls++; return new Promise(resolve => { approve = resolve; }); });
  const first = guards.run(['tab', 'tab'], () => { actions++; });
  await guards.run(['tab'], () => { actions++; });
  assert.equal(calls, 1);
  approve(true);
  await first;
  assert.equal(actions, 1);
});
