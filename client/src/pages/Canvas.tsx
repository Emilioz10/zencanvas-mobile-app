import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ZoomIn, ZoomOut, Home } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function Canvas() {
  const { user } = useAuth();
  const { data: nodes = [] } = trpc.nodes.list.useQuery({}, { enabled: !!user });
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));

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
          {/* Placeholder for graph visualization */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium">Interactive Graph Coming Soon</p>
                <p className="text-calm text-sm mt-1">
                  D3.js-powered visualization with pan, zoom, and node editing
                </p>
              </div>
              {nodes.length === 0 && (
                <Link href="/node/new">
                  <Button variant="outline">Create Your First Node</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Canvas Controls */}
          <div className="absolute bottom-4 right-4 flex gap-2 bg-card border border-soft rounded-lg p-2 shadow-card">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomOut}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <div className="px-2 py-1 text-xs text-calm border-l border-r border-soft">
              {Math.round(zoom * 100)}%
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomIn}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-4 p-4 bg-soft/30 rounded-lg border border-soft text-sm text-calm">
          <p>
            💡 The canvas will display all your nodes as an interactive network. Drag nodes to reposition, click to edit, and draw connections to create relationships.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
