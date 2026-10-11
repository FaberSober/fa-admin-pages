import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { createMemoryRouter } from 'react-router-dom';
const compile = async file => {
  const { outputText } = ts.transpileModule(await readFile(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext } });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
};
const { routeLeaveKeys } = await compile('./routeLeavePolicy.ts');
const { createTabLeaveGuards } = await compile('./tabLeaveGuards.ts');
const loc = (pathname, search = '', hash = '') => ({ pathname, search, hash });
const tabs = [{ key: 'flow', path: '/admin/flow' }, { key: 'home', path: '/admin/home' }];

test('switching cached tabs preserves editors without prompting', () => {
  assert.deepEqual(routeLeaveKeys(loc('/admin/flow'), loc('/admin/home'), tabs, 'flow', ['flow']), []);
  assert.deepEqual(routeLeaveKeys(loc('/admin/flow'), loc('/admin/detail'), tabs, 'flow', ['flow']), []);
});
test('same owner query replacement and uncached route departure protect owner', () => {
  assert.deepEqual(routeLeaveKeys(loc('/admin/flow'), loc('/admin/flow', '?id=2'), tabs, 'flow', ['flow']), ['flow']);
  assert.deepEqual(routeLeaveKeys(loc('/admin/detail'), loc('/admin/home'), tabs, '/admin/detail', ['/admin/detail']), ['/admin/detail']);
});
test('leaving admin checks hidden editors too, exact same route needs no check', () => {
  assert.deepEqual(routeLeaveKeys(loc('/admin/home'), loc('/login'), tabs, 'home', ['flow', 'hidden']), ['flow', 'hidden']);
  assert.deepEqual(routeLeaveKeys(loc('/admin/flow'), loc('/admin/flow'), tabs, 'flow', ['flow']), []);
});
test('replacing a hidden cached route protects that editor, revisiting it does not', () => {
  const cached = new Map([['flow', '/admin/flow?id=1']]);
  assert.deepEqual(routeLeaveKeys(loc('/admin/home'), loc('/admin/flow', '?id=2'), tabs, 'home', ['flow'], cached), ['flow']);
  assert.deepEqual(routeLeaveKeys(loc('/admin/home'), loc('/admin/flow', '?id=1'), tabs, 'home', ['flow'], cached), []);
  assert.deepEqual(routeLeaveKeys(loc('/admin/detail'), loc('/admin/flow', '?id=2'), tabs, '/admin/detail', ['flow', '/admin/detail'], cached), ['/admin/detail', 'flow']);
});

test('data router cancellation preserves URL and confirmation proceeds', async () => {
  const router = createMemoryRouter([{ path: '/admin/flow', element: null }, { path: '/login', element: null }], { initialEntries: ['/admin/flow'] });
  const guards = createTabLeaveGuards();
  let allow = false;
  guards.register('flow', async () => allow);
  const predicate = ({ currentLocation, nextLocation }) => routeLeaveKeys(currentLocation, nextLocation, tabs, 'flow', guards.keys()).length > 0;
  router.getBlocker('flow', predicate);
  await router.navigate('/login');
  const blocked = router.getBlocker('flow', predicate);
  assert.equal(blocked.state, 'blocked');
  assert.equal(router.state.location.pathname, '/admin/flow');
  const accepted = await guards.run(['flow'], () => blocked.proceed());
  if (!accepted) blocked.reset();
  assert.equal(router.state.location.pathname, '/admin/flow');
  allow = true;
  await router.navigate('/login');
  const retry = router.getBlocker('flow', predicate);
  await guards.run(['flow'], () => retry.proceed());
  assert.equal(router.state.location.pathname, '/login');
  router.dispose();
});

test('browser history navigation is blocked until confirmation', async () => {
  const router = createMemoryRouter([{ path: '/admin/flow', element: null }, { path: '/login', element: null }], { initialEntries: ['/login', '/admin/flow'], initialIndex: 1 });
  const predicate = () => true;
  router.getBlocker('flow', predicate);
  await router.navigate(-1);
  const blocked = router.getBlocker('flow', predicate);
  assert.equal(blocked.state, 'blocked');
  assert.equal(router.state.location.pathname, '/admin/flow');
  blocked.reset();
  assert.equal(router.state.location.pathname, '/admin/flow');
  await router.navigate(-1);
  const navigated = new Promise(resolve => {
    const unsubscribe = router.subscribe(state => {
      if (state.location.pathname === '/login') {
        unsubscribe();
        resolve();
      }
    });
  });
  router.getBlocker('flow', predicate).proceed();
  await navigated;
  assert.equal(router.state.location.pathname, '/login');
  router.dispose();
});
