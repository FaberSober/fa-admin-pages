import { useViewport } from '@xyflow/react';
import type { AlignmentGuide } from './jobFlowAlignment';
import './job-flow-preview.scss';

export default function JobFlowAlignmentGuides({ guides }: { guides: AlignmentGuide[] }) {
  const { x, y, zoom } = useViewport();
  if (!guides.length) return null;
  return (
    <svg className="job-flow-alignment-guides" aria-hidden="true">
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        {guides.map((guide) => (
          <line
            key={guide.axis}
            x1={guide.axis === 'x' ? guide.position : guide.start}
            y1={guide.axis === 'y' ? guide.position : guide.start}
            x2={guide.axis === 'x' ? guide.position : guide.end}
            y2={guide.axis === 'y' ? guide.position : guide.end}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  );
}
