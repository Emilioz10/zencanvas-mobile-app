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

export default function Inbox() {
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
      toast.error("Please enter some content");
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
      toast.success("Added to inbox");
      refetch();
    } catch (error) {
      toast.error("Failed to add to inbox");
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
      toast.success("Moved to Next Actions");
      refetch();
    } catch (error) {
      toast.error("Failed to process");
    }
  };

  const handleDelete = async (nodeId: number) => {
    try {
      await deleteMutation.mutateAsync({ id: nodeId });
      toast.success("Deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-generous">
        {/* Header */}
        <div>
          <h1>Daily Inbox</h1>
          <p className="text-calm mt-2">
            Quickly capture thoughts, tasks, and notes. Process them later.
          </p>
        </div>

        {/* Quick Add */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Capture Something</CardTitle>
            <CardDescription>Add to your inbox without organizing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What's on your mind? A task, idea, note, or question..."
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
              Add to Inbox
            </Button>
          </CardContent>
        </Card>

        {/* Inbox Items */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Inbox ({inboxNodes.length})
          </h2>

          {inboxNodes.length === 0 ? (
            <Card className="shadow-calm">
              <CardContent className="pt-8 pb-8 text-center">
                <p className="text-calm">Your inbox is empty. Capture something to get started!</p>
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
