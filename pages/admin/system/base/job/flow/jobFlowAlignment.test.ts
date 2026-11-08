import type { Node, NodeChange } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import { alignWorkflowNodes, offsetWorkflowChanges } from './jobFlowAlignment';

const node = (id: string, x: number, y: number, width = 100, height = 80): Node => ({
  id,
  position: { x, y },
  measured: { width, height },
  data: {},
});
const reference = node('reference', 500, 600, 160, 140);

describe('workflow alignment', () => {
  it.each(['x', 'y'] as const)('prefers left/top on the %s axis over a closer center or end edge', (axis) => {
    const moving = node('moving', 0, 0);
    const targets =
      axis === 'x'
        ? [node('secondary', 103, 0, 102), node('preferred', 100, 0, 160)]
        : [node('secondary', 0, 103, 100, 82), node('preferred', 0, 100, 100, 140)];
    const position = axis === 'x' ? { x: 104, y: 1000 } : { x: 1000, y: 104 };
    for (const anchor of [undefined, 1, 2] as const) {
      const previous = anchor === undefined ? {} : { [axis]: { nodeId: 'secondary', anchor } };
      const result = alignWorkflowNodes([moving, ...targets], new Map([['moving', position]]), 1, previous);
      // The nearer left/top target wins within the preferred class.
      expect(result.lock[axis]).toEqual({ nodeId: 'secondary', anchor: 0 });
      expect(result.offset[axis]).toBe(-1);
      expect(result.guides[0].position).toBe(103);
    }
  });

  it.each(['x', 'y'] as const)('shows the preferred edge when equal-sized nodes match multiple anchors on %s', (axis) => {
    const position = axis === 'x' ? { x: 104, y: 1000 } : { x: 1000, y: 104 };
    const nodes = [node('moving', 0, 0), node('ref', 100, 100)];
    const result = alignWorkflowNodes(nodes, new Map([['moving', position]]), 1, { [axis]: { nodeId: 'ref', anchor: 2 } });
    expect(result.lock[axis]?.anchor).toBe(0);
    expect(result.guides[0].position).toBe(100);
  });

  it.each([
    ['left', 'x', 504, 1000, 500],
    ['horizontal center', 'x', 534, 1000, 580],
    ['right', 'x', 564, 1000, 660],
    ['top', 'y', 1000, 604, 600],
    ['vertical center', 'y', 1000, 634, 670],
    ['bottom', 'y', 1000, 664, 740],
  ] as const)('snaps the %s anchor', (_label, axis, x, y, coordinate) => {
    const result = alignWorkflowNodes([node('moving', 0, 0), reference], new Map([['moving', { x, y }]]), 1);
    expect(result.offset[axis]).toBe(-4);
    expect(result.guides).toEqual([expect.objectContaining({ axis, position: coordinate })]);
  });

  it.each([0.1, 0.39, 1, 2])('uses a six screen-pixel threshold at zoom %s', (zoom) => {
    const nodes = [node('moving', 0, 0), node('ref', 500, 600)];
    const near = alignWorkflowNodes(nodes, new Map([['moving', { x: 500 + 5 / zoom, y: 1500 }]]), zoom);
    expect(near.offset.x * zoom).toBeCloseTo(-5);
    // Use equal widths so another anchor cannot accidentally match.
    const far = alignWorkflowNodes([nodes[0], node('ref', 500, 600)], new Map([['moving', { x: 500 + 7 / zoom, y: 1500 }]]), zoom);
    expect(far.guides).toEqual([]);
  });

  it('retains an existing target until ten pixels, then releases it', () => {
    const nodes = [node('moving', 0, 0), node('ref', 500, 600)];
    const previous = { x: { nodeId: 'ref', anchor: 0 as const } };
    const retained = alignWorkflowNodes(nodes, new Map([['moving', { x: 509, y: 1500 }]]), 1, previous);
    expect(retained.offset.x).toBe(-9);
    const released = alignWorkflowNodes(nodes, new Map([['moving', { x: 511, y: 1500 }]]), 1, retained.lock);
    expect(released.offset.x).toBe(0);
    expect(released.lock).toEqual({});
  });

  it('chooses the closest candidate and ignores hidden, nested and unmeasured references', () => {
    const nodes = [
      node('moving', 0, 0),
      node('far', 500, 800),
      node('near', 502, 900),
      { ...node('hidden', 504, 900), hidden: true },
      { ...node('nested', 504, 900), parentId: 'parent' },
      { ...node('unmeasured', 504, 900), measured: undefined },
    ];
    const result = alignWorkflowNodes(nodes, new Map([['moving', { x: 504, y: 1500 }]]), 1);
    expect(result.offset.x).toBe(-2);
    expect(result.lock.x?.nodeId).toBe('near');
  });

  it('uses measured sizes after collapse and respects node origins', () => {
    const nodes = [node('moving', 0, 0), { ...node('ref', 550, 600, 100, 40), width: 400, height: 500, origin: [0.5, 0] as [number, number] }];
    const result = alignWorkflowNodes(nodes, new Map([['moving', { x: 504, y: 1500 }]]), 1);
    expect(result.offset.x).toBe(-4);
    expect(result.guides[0].position).toBe(500);
  });

  it('snaps the selection bounds and preserves relative positions and unrelated changes', () => {
    const nodes = [node('a', 0, 0), node('b', 0, 0), node('ref', 100, 1000, 300)];
    const positions = new Map([
      ['a', { x: 104, y: 150 }],
      ['b', { x: 304, y: 450 }],
    ]);
    const result = alignWorkflowNodes(nodes, positions, 1);
    const changes: NodeChange<Node>[] = [
      { type: 'position', id: 'a', position: positions.get('a'), dragging: true },
      { type: 'position', id: 'b', position: positions.get('b'), dragging: true },
      { type: 'select', id: 'ref', selected: false },
    ];
    const adjusted = offsetWorkflowChanges(changes, positions, result.offset);
    expect(adjusted[0]).toMatchObject({ position: { x: 100, y: 150 } });
    expect(adjusted[1]).toMatchObject({ position: { x: 300, y: 450 } });
    expect(adjusted[2]).toBe(changes[2]);
    expect(changes[0]).toMatchObject({ position: { x: 104, y: 150 } });
  });

  it('does not align group members to one another or partially snap unmeasured groups', () => {
    const positions = new Map([
      ['a', { x: 104, y: 150 }],
      ['b', { x: 108, y: 450 }],
    ]);
    expect(alignWorkflowNodes([node('a', 0, 0), node('b', 0, 0)], positions, 1).guides).toEqual([]);
    const nodes = [node('a', 0, 0), { ...node('b', 0, 0), measured: undefined }, node('ref', 100, 1000)];
    expect(alignWorkflowNodes(nodes, positions, 1).offset).toEqual({ x: 0, y: 0 });
  });

  it('computes both guide extents using the final snapped position without mutating nodes', () => {
    const moving = node('moving', 0, 0);
    const result = alignWorkflowNodes([moving, node('ref', 500, 600)], new Map([['moving', { x: 504, y: 604 }]]), 1);
    expect(result.offset).toEqual({ x: -4, y: -4 });
    expect(result.guides).toEqual([
      { axis: 'x', position: 500, start: 588, end: 692 },
      { axis: 'y', position: 600, start: 488, end: 612 },
    ]);
    expect(moving.position).toEqual({ x: 0, y: 0 });
  });
});
