import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Home } from "lucide-react";

interface GraphNode {
  id: number;
  label: string;
  type: string;
  status?: string | null;
}

interface GraphLink {
  source: number;
  target: number;
  type: string;
  label?: string;
}

export function GraphVisualization({ onNodeClick }: { onNodeClick?: (nodeId: number) => void }) {
  const { user } = useAuth();
  const { data: nodes = [], isLoading: nodesLoading } = trpc.nodes.list.useQuery(
    {},
    { enabled: !!user }
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
  });

  // Transform nodes and relationships into graph format
  useEffect(() => {
    const graphNodes: GraphNode[] = nodes.map(node => ({
      id: node.id,
      label: node.body?.substring(0, 20) || `${node.type}`,
      type: node.type,
      status: node.status,
    }));

    // Create demo links to show graph structure
    const graphLinks: GraphLink[] = [];
    if (nodes.length > 1) {
      for (let i = 0; i < Math.min(nodes.length - 1, 5); i++) {
        graphLinks.push({
          source: nodes[i]!.id,
          target: nodes[i + 1]!.id,
          type: "related_to",
        });
      }
    }

    setGraphData({
      nodes: graphNodes,
      links: graphLinks,
    });
  }, [nodes]);

  // Render graph with D3
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create a group for pan/zoom
    const g = svg.append("g");
    gRef.current = g;

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force("link", d3.forceLink(graphData.links as any)
        .id((d: any) => d.id)
        .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Create links
    const link = g.append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1)
      .attr("opacity", 0.3);

    // Create nodes
    const typeColors: Record<string, string> = {
      note: "#3b82f6",
      task: "#ef4444",
      project: "#8b5cf6",
      person: "#ec4899",
      event: "#f59e0b",
      idea: "#10b981",
    };

    const node = g.append("g")
      .selectAll("circle")
      .data(graphData.nodes)
      .enter()
      .append("circle")
      .attr("r", 6)
      .attr("fill", (d: any) => typeColors[d.type] || "#6b7280")
      .attr("opacity", (d: any) => {
        const statusOpacity: Record<string, number> = {
          inbox: 0.6,
          next: 1,
          done: 0.4,
          someday: 0.7,
        };
        return statusOpacity[d.status] || 0.8;
      })
      .attr("cursor", "pointer")
      .on("click", (event: any, d: any) => {
        if (onNodeClick) {
          onNodeClick(d.id);
        }
      })
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // Create labels
    const label = g.append("g")
      .selectAll("text")
      .data(graphData.nodes)
      .enter()
      .append("text")
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("pointer-events", "none")
      .attr("fill", "#374151")
      .text((d: any) => d.label);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y - 12);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Initial zoom to fit
    const initialScale = 0.8;
    svg.call(
      zoom.transform as any,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(initialScale)
    );

    return () => {
      simulation.stop();
    };
  }, [graphData, onNodeClick]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy as any, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy as any, 0.7);
  };

  const handleReset = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(
        zoomRef.current.transform as any,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8)
      );
  };

  if (nodesLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-soft/20 rounded border border-soft">
        <div className="text-center">
          <p className="text-calm text-sm">No nodes yet. Create your first node to see the graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-soft/10 rounded border border-soft overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-card border border-soft rounded-lg p-2 shadow-card">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          title="Zoom in"
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          title="Reset view"
          className="h-8 w-8 p-0"
        >
          <Home className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          title="Zoom out"
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card border border-soft rounded-lg p-3 shadow-card text-xs space-y-1">
        <p className="font-medium text-calm mb-2">Node Types</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
          <span className="text-calm">Note</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
          <span className="text-calm">Task</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#8b5cf6" }} />
          <span className="text-calm">Project</span>
        </div>
      </div>
    </div>
  );
}
