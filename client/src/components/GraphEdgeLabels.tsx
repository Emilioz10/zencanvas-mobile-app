import React from 'react';

interface EdgeLabel {
  x: number;
  y: number;
  label: string;
  angle: number;
}

interface GraphEdgeLabelsProps {
  edges: EdgeLabel[];
}

export function GraphEdgeLabels({ edges }: GraphEdgeLabelsProps) {
  return (
    <g className="edge-labels">
      {edges.map((edge, idx) => (
        <g key={idx} transform={`translate(${edge.x}, ${edge.y})`}>
          {/* Background for label readability */}
          <rect
            x={-40}
            y={-10}
            width={80}
            height={20}
            fill="white"
            opacity={0.9}
            rx={4}
            className="shadow-sm"
          />
          {/* Label text */}
          <text
            textAnchor="middle"
            dy="0.3em"
            className="text-xs font-medium fill-foreground"
            style={{
              transform: `rotate(${edge.angle}deg)`,
              pointerEvents: 'none',
            }}
          >
            {edge.label}
          </text>
        </g>
      ))}
    </g>
  );
}
