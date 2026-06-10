import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Network, Clock, CheckSquare, Inbox } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { DataBackup } from "@/components/DataBackup";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DashboardMiniGraph } from "@/components/DashboardMiniGraph";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { data: nodes, isLoading: nodesLoading } = trpc.nodes.list.useQuery(
    {},
    { enabled: !!user }
  );

  if (authLoading) {
    return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;
  }

  const recentNodes = nodes?.slice(0, 5) || [];
  const taskCount = nodes?.filter(n => n.type === "task").length || 0;
  const noteCount = nodes?.filter(n => n.type === "note").length || 0;

  return (
    <DashboardLayout>
      <div className="space-generous">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>{t('auth.welcome')}, {user?.name || "there"}</h1>
            <p className="text-calm mt-2">{t('common.search')}</p>
          </div>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <Link href="/canvas">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t('common.add')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-generous">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-calm">{t('common.search')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{nodes?.length || 0}</div>
              <p className="text-xs text-calm mt-1">{t('common.add')}</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-calm">{t('tasks.nextActions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{taskCount}</div>
              <p className="text-xs text-calm mt-1">{t('tasks.projects')}</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-calm">{t('nodeEditor.tags')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{noteCount}</div>
              <p className="text-xs text-calm mt-1">{t('inbox.captureNote')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/canvas">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
              <Network className="w-5 h-5" />
              <span className="text-xs">{t('nav.canvas')}</span>
            </Button>
          </Link>
          <Link href="/inbox">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
              <Inbox className="w-5 h-5" />
              <span className="text-xs">{t('nav.inbox')}</span>
            </Button>
          </Link>
          <Link href="/tasks">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
              <CheckSquare className="w-5 h-5" />
              <span className="text-xs">{t('nav.tasks')}</span>
            </Button>
          </Link>
          <Link href="/timeline">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
              <Clock className="w-5 h-5" />
              <span className="text-xs">{t('nav.timeline')}</span>
            </Button>
          </Link>
        </div>

        {/* Data Backup */}
        <DataBackup />

        {/* Knowledge Graph Preview */}
        <DashboardMiniGraph />

        {/* Recent Nodes */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{t('common.add')}</CardTitle>
            <CardDescription>{t('inbox.captureNote')}</CardDescription>
          </CardHeader>
          <CardContent>
            {nodesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : recentNodes.length > 0 ? (
              <div className="space-y-2">
                {recentNodes.map(node => (
                  <Link key={node.id} href={`/node/${node.id}`}>
                    <div className="p-3 rounded-lg border border-soft hover:bg-soft transition-calm cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {node.body?.substring(0, 50) || `Untitled ${node.type}`}
                          </p>
                          <p className="text-xs text-calm mt-1">
                            {node.type} • {new Date(node.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-calm text-sm">No nodes yet. Create your first node to get started!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
