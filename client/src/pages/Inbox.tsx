import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Archive, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function Inbox() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: inboxNodes = [], refetch } = trpc.nodes.list.useQuery(
    { status: "inbox" },
    { enabled: !!user }
  );

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = trpc.nodes.create.useMutation();
  const updateMutation = trpc.nodes.update.useMutation();
  const deleteMutation = trpc.nodes.delete.useMutation();

  const handleAddToInbox = async () => {
    if (!body.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        type: "note",
        body: body.trim(),
        status: "inbox",
      });
      setBody("");
      setTitle("");
      toast.success(t('common.success'));
      refetch();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcess = async (nodeId: number) => {
    try {
      await updateMutation.mutateAsync({
        id: nodeId,
        status: "next",
      });
      toast.success(t('common.success'));
      refetch();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (nodeId: number) => {
    try {
      await deleteMutation.mutateAsync({ id: nodeId });
      toast.success(t('common.success'));
      refetch();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-generous">
        {/* Header */}
        <div>
          <h1>{t('nav.inbox')}</h1>
          <p className="text-calm mt-2">
            {t('inbox.placeholder')}
          </p>
        </div>

        {/* Quick Add */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">{t('inbox.quickCapture')}</CardTitle>
            <CardDescription>{t('inbox.captureNote')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={t('inbox.placeholder')}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-24 resize-none"
            />
            <Button
              onClick={handleAddToInbox}
              disabled={isSubmitting || !body.trim()}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('common.add')}
            </Button>
          </CardContent>
        </Card>

        {/* Inbox Items */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            {t('nav.inbox')} ({inboxNodes.length})
          </h2>

          {inboxNodes.length === 0 ? (
            <Card className="shadow-calm">
              <CardContent className="pt-8 pb-8 text-center">
                <p className="text-calm">{t('common.loading')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {inboxNodes.map(node => (
                <Card key={node.id} className="shadow-calm hover:shadow-card transition-calm">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">
                          {node.body}
                        </p>
                        <p className="text-xs text-calm mt-2">
                          {new Date(node.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProcess(node.id)}
                          title="Process this item"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(node.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <Card className="bg-soft/30 border-soft">
          <CardContent className="pt-4">
            <p className="text-sm text-calm">
              💡 Your inbox is a temporary holding area. Process items by moving them to Next Actions, or link them to existing nodes in your graph.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
