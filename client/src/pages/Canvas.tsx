import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { GraphVisualization } from "@/components/GraphVisualization";
import { GraphFilter } from "@/components/GraphFilter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Canvas() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [visibleTypes, setVisibleTypes] = useState<string[]>(['task', 'note', 'project', 'person', 'event', 'idea']);
  const { data: nodes = [] } = trpc.nodes.list.useQuery({}, { enabled: !!user });

  const filteredNodes = nodes.filter(n => visibleTypes.includes(n.type));

  const handleNodeClick = (nodeId: number) => {
    setLocation(`/node/${nodeId}`);
  };

  const handleFilterChange = (types: string[]) => {
    setVisibleTypes(types);
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-soft">
          <div>
            <h1>{t('nav.canvas')}</h1>
            <p className="text-calm text-sm mt-1">
              {filteredNodes.length} of {nodes.length} nodes visible
            </p>
          </div>
          <div className="flex gap-2">
            <GraphFilter onFilterChange={handleFilterChange} />
            <Link href="/node/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t('common.add')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-soft/20 rounded-lg mt-4 overflow-hidden border border-soft">
          <GraphVisualization onNodeClick={handleNodeClick} />
        </div>

        {/* Bottom Info */}
        <div className="mt-4 p-4 bg-soft/30 rounded-lg border border-soft text-sm text-calm">
          <p>
            💡 <strong>{t('common.search')}:</strong> {t('common.add')}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
