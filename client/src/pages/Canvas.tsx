import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { GraphVisualization } from "@/components/GraphVisualization";

export default function Canvas() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: nodes = [] } = trpc.nodes.list.useQuery({}, { enabled: !!user });

  const handleNodeClick = (nodeId: number) => {
    setLocation(`/node/${nodeId}`);
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-soft">
          <div>
            <h1>Visual Graph Canvas</h1>
            <p className="text-calm text-sm mt-1">
              {nodes.length} nodes connected across your knowledge graph
            </p>
          </div>
          <Link href="/node/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Node
            </Button>
          </Link>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-soft/20 rounded-lg mt-4 overflow-hidden border border-soft">
          <GraphVisualization onNodeClick={handleNodeClick} />
        </div>

        {/* Bottom Info */}
        <div className="mt-4 p-4 bg-soft/30 rounded-lg border border-soft text-sm text-calm">
          <p>
            💡 <strong>Interactive Graph:</strong> Drag nodes to reposition, click to edit. Colors represent node types (blue=note, red=task, purple=project). Opacity shows status (full=active, faded=done).
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
