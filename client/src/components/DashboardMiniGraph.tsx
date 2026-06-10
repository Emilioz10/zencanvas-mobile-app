import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';

interface Node {
  id: number;
  title: string;
  type: string;
}

interface Link {
  source: number;
  target: number;
  type: string;
}

const NODE_COLORS: Record<string, string> = {
  task: '#3b82f6',
  note: '#fbbf24',
  project: '#10b981',
  person: '#ec4899',
  event: '#a855f7',
  idea: '#f97316',
};

export function DashboardMiniGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { data: nodes, isLoading: nodesLoading } = trpc.nodes.list.useQuery({});
  const { data: relationships } = trpc.relationships.forNode.useQuery({ nodeId: 0 }, { enabled: false });

  useEffect(() => {
    if (!svgRef.current || !nodes || nodes.length === 0) return;

    // Take only first 20 nodes for mini graph
    const limitedNodes = nodes.slice(0, 20);
    const nodeIds = new Set(limitedNodes.map(n => n.id));
    const limitedLinks = (relationships?.outgoing || []).filter(
      (r: any) => nodeIds.has(r.sourceNodeId) && nodeIds.has(r.targetNodeId)
    );

    const width = 300;
    const height = 200;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const simulation = d3.forceSimulation(limitedNodes as any)
      .force('link', d3.forceLink(limitedLinks as any)
        .id((d: any) => d.id)
        .distance(40))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Links
    const link = svg.append('g')
      .selectAll('line')
      .data(limitedLinks)
      .enter()
      .append('line')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1)
      .attr('opacity', 0.6);

    // Nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(limitedNodes)
      .enter()
      .append('circle')
      .attr('r', 4)
      .attr('fill', (d: any) => NODE_COLORS[d.type] || '#6b7280')
      .attr('opacity', 0.8);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
    });
  }, [nodes, relationships]);

  if (nodesLoading) {
    return <Skeleton className="h-56" />;
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Knowledge Graph</CardTitle>
        <CardDescription>Visual preview of your connections</CardDescription>
      </CardHeader>
      <CardContent>
        <svg
          ref={svgRef}
          className="w-full border border-border rounded"
          style={{ background: '#fafafa' }}
        />
      </CardContent>
    </Card>
  );
}
