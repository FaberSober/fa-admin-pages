import { applyNodeChanges, type Node, type NodeChange, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { alignWorkflowNodes, type AlignmentGuide, type AlignmentLock, offsetWorkflowChanges } from './jobFlowAlignment';

export default function useJobFlowAlignment<NodeType extends Node>(setNodes: (nodes: NodeType[]) => void) {
  const { getNodes, getViewport } = useReactFlow<NodeType>();
  const [guides, setGuides] = useState<AlignmentGuide[]>([]);
  const lock = useRef<AlignmentLock>({});
  const rawDrag = useRef<NodeChange<NodeType>[]>();
  const altPressed = useRef(false);

  const onNodesChange = useCallback(
    (changes: NodeChange<NodeType>[]) => {
      const positions = new Map(
        changes.flatMap((change) =>
          change.type === 'position' && change.position && change.dragging !== undefined ? [[change.id, change.position] as const] : [],
        ),
      );
      const dragging = changes.some((change) => change.type === 'position' && change.dragging === true);
      const finishing = !dragging && changes.some((change) => change.type === 'position' && change.dragging === false);
      const nodes = getNodes();
      let nextChanges = changes;
      if (positions.size && (dragging || (finishing && rawDrag.current))) {
        if (dragging) rawDrag.current = changes.filter((change) => change.type === 'position');
        const result = altPressed.current
          ? { offset: { x: 0, y: 0 }, guides: [], lock: {} }
          : alignWorkflowNodes(nodes, positions, getViewport().zoom, lock.current);
        lock.current = result.lock;
        setGuides(finishing ? [] : result.guides);
        nextChanges = offsetWorkflowChanges(changes, positions, result.offset);
      }
      if (finishing) {
        rawDrag.current = undefined;
        lock.current = {};
        setGuides([]);
      }
      // Always use the store's latest nodes, preserving edits made inside node components.
      setNodes(applyNodeChanges(nextChanges, nodes));
    },
    [getNodes, getViewport, setNodes],
  );

  const onDragStart = useCallback((event: Pick<MouseEvent, 'altKey'>) => {
    altPressed.current = event.altKey;
    rawDrag.current = undefined;
    lock.current = {};
    setGuides([]);
  }, []);

  const onDragStop = useCallback(() => {
    rawDrag.current = undefined;
    lock.current = {};
    setGuides([]);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (altPressed.current === event.altKey) return;
      altPressed.current = event.altKey;
      lock.current = {};
      // Update even if Alt changes while the pointer is stationary.
      if (rawDrag.current) onNodesChange(rawDrag.current);
    };
    const onBlur = () => {
      altPressed.current = false;
      onDragStop();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', onBlur);
    };
  }, [onNodesChange, onDragStop]);

  return { guides, onNodesChange, onDragStart, onDragStop };
}
