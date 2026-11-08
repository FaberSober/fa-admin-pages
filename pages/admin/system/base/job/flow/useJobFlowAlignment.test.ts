import type { Node, NodeChange } from '@xyflow/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  nodes: [] as Node[],
  effects: [] as Array<() => () => void>,
  setGuides: vi.fn(),
}));
vi.mock('react', () => ({
  useRef: (current: unknown) => ({ current }),
  useState: (value: unknown) => [value, mocks.setGuides],
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => () => void) => {
    mocks.effects.push(effect);
  },
}));
vi.mock('@xyflow/react', async (load) => ({
  ...(await load<typeof import('@xyflow/react')>()),
  useReactFlow: () => ({ getNodes: () => mocks.nodes, getViewport: () => ({ zoom: 1 }) }),
}));
import useJobFlowAlignment from './useJobFlowAlignment';

const listeners = new Map<string, (event: any) => void>();
let cleanup: Array<() => void> = [];
const change = (x: number, dragging = true): NodeChange<Node>[] => [{ id: 'moving', type: 'position', position: { x, y: 1000 }, dragging }];
function setup() {
  const alignment = useJobFlowAlignment((nodes) => {
    mocks.nodes = nodes;
  });
  cleanup = mocks.effects.map((effect) => effect());
  alignment.onDragStart({ altKey: false } as MouseEvent);
  return alignment;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.effects = [];
  mocks.nodes = [
    { id: 'moving', position: { x: 0, y: 0 }, measured: { width: 100, height: 80 }, data: { config: 'latest' } },
    { id: 'ref', position: { x: 100, y: 0 }, measured: { width: 100, height: 80 }, data: {} },
  ];
  listeners.clear();
  vi.stubGlobal('window', {
    addEventListener: (name: string, callback: (event: any) => void) => listeners.set(name, callback),
    removeEventListener: (name: string) => listeners.delete(name),
  });
});
afterEach(() => {
  cleanup.forEach((dispose) => {
    dispose();
  });
  vi.unstubAllGlobals();
});

it('keeps the snapped position on mouse release and through save/reload, clearing guides', () => {
  const alignment = setup();
  alignment.onNodesChange(change(104));
  expect(mocks.nodes[0].position.x).toBe(100);
  alignment.onNodesChange(change(104, false));
  alignment.onDragStop();
  expect(JSON.parse(JSON.stringify(mocks.nodes))[0]).toMatchObject({ position: { x: 100, y: 1000 }, dragging: false, data: { config: 'latest' } });
  expect(mocks.setGuides).toHaveBeenLastCalledWith([]);
});

it('Alt releases snapping immediately and releasing Alt re-enables it without moving the pointer', () => {
  const alignment = setup();
  alignment.onNodesChange(change(104));
  listeners.get('keydown')!({ altKey: true });
  expect(mocks.nodes[0].position.x).toBe(104);
  expect(mocks.setGuides).toHaveBeenLastCalledWith([]);
  listeners.get('keyup')!({ altKey: false });
  expect(mocks.nodes[0].position.x).toBe(100);
  listeners.get('keydown')!({ altKey: true });
  alignment.onNodesChange(change(104, false));
  expect(mocks.nodes[0].position.x).toBe(104);
});

it('honors Alt already held at drag start and leaves non-drag position changes untouched', () => {
  const alignment = setup();
  alignment.onDragStart({ altKey: true } as MouseEvent);
  alignment.onNodesChange(change(104));
  expect(mocks.nodes[0].position.x).toBe(104);
  alignment.onDragStop();
  alignment.onNodesChange([{ id: 'moving', type: 'position', position: { x: 105, y: 1000 } }]);
  expect(mocks.nodes[0].position.x).toBe(105);
});

it('preserves the latest node data during dimension changes and cleans up on blur and unmount', () => {
  const alignment = setup();
  alignment.onNodesChange(change(104));
  mocks.nodes[0] = { ...mocks.nodes[0], data: { config: 'edited-in-node' } };
  alignment.onNodesChange([{ id: 'moving', type: 'dimensions', dimensions: { width: 100, height: 60 } }]);
  expect(mocks.nodes[0].data.config).toBe('edited-in-node');
  listeners.get('blur')!({});
  expect(mocks.setGuides).toHaveBeenLastCalledWith([]);
  cleanup.forEach((dispose) => {
    dispose();
  });
  expect(listeners.size).toBe(0);
});
