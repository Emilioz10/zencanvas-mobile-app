import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as d3 from "d3";

interface TaskNode extends d3.SimulationNodeDatum {
  id: number;
  title: string;
  status: string;
  type: string;
}

interface Dependency {
  source: number;
  target: number;
  type: string;
}

interface TaskDependencyMapProps {
  nodes: TaskNode[];
  dependencies: Dependency[];
  onNodeClick?: (nodeId: number) => void;
}

export function TaskDependencyMap({ nodes, dependencies, onNodeClick }: TaskDependencyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = 1000;
    const height = 600;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid #e5e7eb")
      .style("border-radius", "8px")
      .style("background", "#fafafa");

    // Add zoom behavior
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
    svg.call(zoom);

    // Create force simulation
    const simulation = d3
      .forceSimulation<TaskNode>(nodes)
      .force("link", d3.forceLink<TaskNode, Dependency>()
        .id((d) => d.id.toString())
        .links(dependencies)
        .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Draw links
    const links = g
      .selectAll("line")
      .data(dependencies)
      .enter()
      .append("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");

    // Add arrow marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("refX", 9)
      .attr("refY", 3)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 10 3, 0 6")
      .attr("fill", "#cbd5e1");

    // Draw nodes
    const nodeGroups = g
      .selectAll("g.node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(
        d3
          .drag<SVGGElement, TaskNode>()
          .on("start", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node circles
    nodeGroups
      .append("circle")
      .attr("r", 30)
      .attr("fill", (d) => {
        if (d.status === "done") return "#10b981";
        if (d.status === "in_progress") return "#3b82f6";
        if (d.status === "blocked") return "#ef4444";
        return "#f59e0b";
      })
      .attr("opacity", 0.8)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        if (onNodeClick) onNodeClick(d.id);
      });

    // Node labels
    nodeGroups
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", "#fff")
      .attr("pointer-events", "none")
      .text((d) => `T${d.id}`);

    // Simulation tick
    simulation.on("tick", () => {
      links
        .attr("x1", (d: any) => d.source?.x || 0)
        .attr("y1", (d: any) => d.source?.y || 0)
        .attr("x2", (d: any) => d.target?.x || 0)
        .attr("y2", (d: any) => d.target?.y || 0);

      nodeGroups.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Reset zoom button handler
    const handleReset = () => {
      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform as any,
          d3.zoomIdentity.translate(0, 0).scale(1)
        );
    };

    return () => {
      simulation.stop();
    };
  }, [nodes, dependencies, onNodeClick]);

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Task Dependency Map</h2>
        <Button variant="outline" size="sm" onClick={() => {
          // Reset zoom
          if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(750).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
          }
        }}>
          Reset View
        </Button>
      </div>
      <svg ref={svgRef} style={{ width: "100%", height: "600px" }} />
      <p className="text-sm text-gray-500 mt-4">
        Drag nodes to rearrange • Scroll to zoom • Click node to edit
      </p>
    </Card>
  );
}
