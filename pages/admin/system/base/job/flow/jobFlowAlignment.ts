import type { Node, NodeChange, XYPosition } from '@xyflow/react';

type Bounds = { x: number; y: number; width: number; height: number };
type Anchor = 0 | 1 | 2;
type AlignmentMatch = { nodeId: string; anchor: Anchor };
type AlignmentCandidate = AlignmentMatch & { bounds: Bounds; delta: number };
export type AlignmentLock = { x?: AlignmentMatch; y?: AlignmentMatch };
export type AlignmentGuide = { axis: 'x' | 'y'; position: number; start: number; end: number };

const ANCHORS: Anchor[] = [0, 1, 2];

function boundsOf(node: Node, position = node.position): Bounds | undefined {
  const width = node.measured?.width ?? node.width;
  const height = node.measured?.height ?? node.height;
  if (node.hidden || node.parentId || !width || !height) return undefined;
  return {
    x: position.x - width * (node.origin?.[0] ?? 0),
    y: position.y - height * (node.origin?.[1] ?? 0),
    width,
    height,
  };
}

function anchorAt(bounds: Bounds, axis: 'x' | 'y', anchor: Anchor) {
  return bounds[axis] + (bounds[axis === 'x' ? 'width' : 'height'] * anchor) / 2;
}

/** Inputs are raw drag positions. Thresholds use screen pixels, independent of canvas zoom. */
export function alignWorkflowNodes(nodes: Node[], positions: ReadonlyMap<string, XYPosition>, zoom: number, previous: AlignmentLock = {}) {
  const moving: Bounds[] = [];
  const references: Array<{ nodeId: string; bounds: Bounds }> = [];
  for (const node of nodes) {
    const bounds = boundsOf(node, positions.get(node.id));
    if (!bounds) {
      // Do not partially snap a selection whose dimensions are not available yet.
      if (positions.has(node.id)) return { offset: { x: 0, y: 0 }, guides: [], lock: {} };
      continue;
    }
    if (positions.has(node.id)) moving.push(bounds);
    else references.push({ nodeId: node.id, bounds });
  }
  const offset = { x: 0, y: 0 };
  const guides: AlignmentGuide[] = [];
  const lock: AlignmentLock = {};
  if (!moving.length || zoom <= 0) return { offset, guides, lock };
  const x = Math.min(...moving.map((bounds) => bounds.x));
  const y = Math.min(...moving.map((bounds) => bounds.y));
  const group: Bounds = {
    x,
    y,
    width: Math.max(...moving.map((bounds) => bounds.x + bounds.width)) - x,
    height: Math.max(...moving.map((bounds) => bounds.y + bounds.height)) - y,
  };
  const matches: Partial<Record<'x' | 'y', { bounds: Bounds; position: number }>> = {};
  for (const axis of ['x', 'y'] as const) {
    let best: AlignmentCandidate | undefined;
    const retained = previous[axis];
    const retainedNode = references.find((node) => node.nodeId === retained?.nodeId);
    if (retained && retainedNode) {
      const delta = anchorAt(retainedNode.bounds, axis, retained.anchor) - anchorAt(group, axis, retained.anchor);
      if (Math.abs(delta) * zoom <= 10) best = { ...retainedNode, anchor: retained.anchor, delta };
    }
    let nearest: AlignmentCandidate | undefined;
    for (const reference of references) {
      for (const anchor of ANCHORS) {
        const delta = anchorAt(reference.bounds, axis, anchor) - anchorAt(group, axis, anchor);
        const preferred = anchor === 0;
        const currentPreferred = nearest?.anchor === 0;
        if (
          Math.abs(delta) * zoom <= 6 &&
          (!nearest || (preferred && !currentPreferred) || (preferred === currentPreferred && Math.abs(delta) < Math.abs(nearest.delta)))
        ) {
          nearest = { ...reference, anchor, delta };
        }
      }
    }
    // Left/top take precedence even when a center/right/bottom target is already locked.
    if (nearest && (!best || (nearest.anchor === 0 && best.anchor !== 0))) best = nearest;
    if (best) {
      offset[axis] = best.delta;
      lock[axis] = { nodeId: best.nodeId, anchor: best.anchor };
      matches[axis] = { bounds: best.bounds, position: anchorAt(best.bounds, axis, best.anchor) };
    }
  }
  for (const axis of ['x', 'y'] as const) {
    const match = matches[axis];
    if (!match) continue;
    const crossAxis = axis === 'x' ? 'y' : 'x';
    const length = axis === 'x' ? 'height' : 'width';
    guides.push({
      axis,
      position: match.position,
      start: Math.min(group[crossAxis] + offset[crossAxis], match.bounds[crossAxis]) - 12 / zoom,
      end: Math.max(group[crossAxis] + offset[crossAxis] + group[length], match.bounds[crossAxis] + match.bounds[length]) + 12 / zoom,
    });
  }
  return { offset, guides, lock };
}

/** Apply one common offset so multi-selection dragging preserves relative positions. */
export function offsetWorkflowChanges<NodeType extends Node>(changes: NodeChange<NodeType>[], positions: ReadonlyMap<string, XYPosition>, offset: XYPosition) {
  return changes.map((change) =>
    change.type === 'position' && change.position && positions.has(change.id)
      ? { ...change, position: { x: change.position.x + offset.x, y: change.position.y + offset.y } }
      : change,
  );
}
