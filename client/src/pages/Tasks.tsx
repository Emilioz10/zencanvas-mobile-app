import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function Tasks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: allTasks = [], refetch } = trpc.nodes.list.useQuery(
    { type: "task" },
    { enabled: !!user }
  );

  const updateMutation = trpc.nodes.update.useMutation();

  const tasks = {
    inbox: allTasks.filter(t => t.status === "inbox"),
    next: allTasks.filter(t => t.status === "next"),
    someday: allTasks.filter(t => t.status === "someday"),
    done: allTasks.filter(t => t.status === "done"),
  };

  const handleStatusChange = async (nodeId: number, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({
        id: nodeId,
        status: newStatus,
      });
      refetch();
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  /** Traffic-light for tasks: based on how long since last update */
  const taskTrafficLight = (updatedAt: string | Date) => {
    const days = (Date.now() - new Date(updatedAt).getTime()) / 86400000;
    if (days < 1) return { bg: "#d1fae5", color: "#059669", dot: "#10b981", label: "עודכןי" };
    if (days < 3) return { bg: "#d1fae5", color: "#047857", dot: "#10b981", label: `${Math.floor(days)}ד` };
    if (days < 7) return { bg: "#fef3c7", color: "#d97706", dot: "#f59e0b", label: `${Math.floor(days)}ד` };
    if (days < 14) return { bg: "#fef3c7", color: "#b45309", dot: "#f59e0b", label: `${Math.floor(days)}ד` };
    if (days < 30) return { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444", label: `${Math.floor(days / 7)}שב` };
    return { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", label: `${Math.floor(days / 30)}ח` };
  };

  const TaskItem = ({ task, showStatus = false }: { task: any; showStatus?: boolean }) => {
    const tl = taskTrafficLight(task.updatedAt);
    const isDone = task.status === "done";
    return (
      <Card
        className="hover:shadow-card transition-calm"
        style={{ borderRightWidth: 4, borderRightColor: isDone ? "#d1d5db" : tl.dot }}
      >
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isDone}
              onCheckedChange={(checked) =>
                handleStatusChange(task.id, checked ? "done" : "next")
              }
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-relaxed ${isDone ? "line-through text-calm" : ""}`}>
                {task.body}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {!isDone && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: tl.bg, color: tl.color }}
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tl.dot }} />
                    {tl.label}
                  </span>
                )}
                <span className="text-xs text-calm">
                  {new Date(task.updatedAt).toLocaleDateString("he-IL")}
                </span>
              </div>
            </div>
            {showStatus && (
              <span className="text-xs font-medium px-2 py-1 bg-accent/10 text-accent rounded">
                {task.status}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-generous">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>{t('nav.tasks')}</h1>
            <p className="text-calm mt-2">{t('tasks.projects')}</p>
          </div>
          <Link href="/node/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t('tasks.addTask')}
            </Button>
          </Link>
        </div>

        {/* GTD Views */}
        <Tabs defaultValue="next" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inbox">
              {t('tasks.inbox')}
              <span className="ml-1 text-xs">{tasks.inbox.length}</span>
            </TabsTrigger>
            <TabsTrigger value="next">
              {t('tasks.nextActions')}
              <span className="ml-1 text-xs">{tasks.next.length}</span>
            </TabsTrigger>
            <TabsTrigger value="someday">
              {t('tasks.someday')}
              <span className="ml-1 text-xs">{tasks.someday.length}</span>
            </TabsTrigger>
            <TabsTrigger value="done">
              {t('tasks.done')}
              <span className="ml-1 text-xs">{tasks.done.length}</span>
            </TabsTrigger>
          </TabsList>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="space-y-3 mt-4">
            {tasks.inbox.length === 0 ? (
              <Card className="shadow-calm">
                <CardContent className="pt-8 pb-8 text-center">
                  <p className="text-calm">{t('common.loading')}</p>
                </CardContent>
              </Card>
            ) : (
              tasks.inbox.map(task => <TaskItem key={task.id} task={task} />)
            )}
          </TabsContent>

          {/* Next Actions Tab */}
          <TabsContent value="next" className="space-y-3 mt-4">
            {tasks.next.length === 0 ? (
              <Card className="shadow-calm">
                <CardContent className="pt-8 pb-8 text-center">
                  <p className="text-calm">{t('common.loading')}</p>
                </CardContent>
              </Card>
            ) : (
              tasks.next.map(task => <TaskItem key={task.id} task={task} />)
            )}
          </TabsContent>

          {/* Someday/Maybe Tab */}
          <TabsContent value="someday" className="space-y-3 mt-4">
            {tasks.someday.length === 0 ? (
              <Card className="shadow-calm">
                <CardContent className="pt-8 pb-8 text-center">
                  <p className="text-calm">{t('tasks.someday')}</p>
                </CardContent>
              </Card>
            ) : (
              tasks.someday.map(task => <TaskItem key={task.id} task={task} />)
            )}
          </TabsContent>

          {/* Done Tab */}
          <TabsContent value="done" className="space-y-3 mt-4">
            {tasks.done.length === 0 ? (
              <Card className="shadow-calm">
                <CardContent className="pt-8 pb-8 text-center">
                  <p className="text-calm">{t('tasks.done')}</p>
                </CardContent>
              </Card>
            ) : (
              tasks.done.map(task => <TaskItem key={task.id} task={task} />)
            )}
          </TabsContent>
        </Tabs>

        {/* Info */}
        <Card className="bg-soft/30 border-soft">
          <CardContent className="pt-4">
            <p className="text-sm text-calm">
              💡 <strong>GTD Workflow:</strong> Inbox (capture) → Next (ready to do) → Done (completed). Someday/Maybe for deferred tasks.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
