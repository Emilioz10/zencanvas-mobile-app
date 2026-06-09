import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Save, X } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function NodeDetail() {
  const { user } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  const nodeId = params?.id ? parseInt(params.id) : null;

  const { data: node, isLoading } = trpc.nodes.get.useQuery(
    { id: nodeId! },
    { enabled: !!user && !!nodeId && nodeId !== 0 }
  );

  const { data: relationships } = trpc.relationships.forNode.useQuery(
    { nodeId: nodeId! },
    { enabled: !!user && !!nodeId && nodeId !== 0 }
  );

  const [body, setBody] = useState("");
  const [type, setType] = useState("note");
  const [status, setStatus] = useState("inbox");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateMutation = trpc.nodes.update.useMutation();
  const deleteMutation = trpc.nodes.delete.useMutation();
  const createMutation = trpc.nodes.create.useMutation();

  // For new nodes
  const isNewNode = nodeId === 0 || !nodeId;

  useEffect(() => {
    if (node) {
      setBody(node.body || "");
      setType(node.type);
      setStatus(node.status || "inbox");
      setTags(node.tags ? node.tags.split(",").map(t => t.trim()).filter(Boolean) : []);
      try {
        const props = node.properties ? JSON.parse(node.properties) : {};
        setDueDate(props.dueDate || "");
      } catch (e) {
        // ignore parse errors
      }
    }
  }, [node]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    if (!body.trim() && !isNewNode) {
      toast.error("Node cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const tagsStr = tags.join(",");
      const properties = JSON.stringify({ dueDate });

      if (isNewNode) {
        await createMutation.mutateAsync({
          type: type as any,
          body: body.trim(),
          status,
          tags: tagsStr,
          properties,
        });
        toast.success("Node created");
        setLocation("/dashboard");
      } else if (nodeId) {
        await updateMutation.mutateAsync({
          id: nodeId,
          body: body.trim(),
          status,
          tags: tagsStr,
          properties,
        });
        toast.success("Node saved");
      }
    } catch (error) {
      toast.error("Failed to save node");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!nodeId || isNewNode) return;
    if (!confirm("Are you sure? This will delete the node and its connections.")) return;

    try {
      await deleteMutation.mutateAsync({ id: nodeId });
      toast.success("Node deleted");
      setLocation("/dashboard");
    } catch (error) {
      toast.error("Failed to delete node");
    }
  };

  if (isLoading && !isNewNode) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-generous max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1>{isNewNode ? "New Node" : "Edit Node"}</h1>
        </div>

        {/* Node Editor */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Node Details</CardTitle>
            <CardDescription>
              {isNewNode ? "Create a new node to add to your knowledge graph" : "Edit this node's content and properties"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="person">Person</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="idea">Idea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbox">Inbox</SelectItem>
                    <SelectItem value="next">Next</SelectItem>
                    <SelectItem value="someday">Someday</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button onClick={handleAddTag} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="text-sm font-medium mb-2 block">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                placeholder="Write your note, task, or idea here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-48 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save Node"}
                </Button>
              </div>
              {!isNewNode && (
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Relationships */}
        {!isNewNode && relationships && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Connections</CardTitle>
              <CardDescription>Nodes linked to this item</CardDescription>
            </CardHeader>
            <CardContent>
              {relationships.outgoing.length === 0 && relationships.incoming.length === 0 ? (
                <p className="text-calm text-sm">No connections yet. Link this node to others in the graph.</p>
              ) : (
                <div className="space-y-4">
                  {relationships.outgoing.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Outgoing Links</p>
                      <div className="space-y-1">
                        {relationships.outgoing.map(rel => (
                          <div key={rel.id} className="text-sm text-calm">
                            → {rel.type} {rel.label && `(${rel.label})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {relationships.incoming.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Incoming Links</p>
                      <div className="space-y-1">
                        {relationships.incoming.map(rel => (
                          <div key={rel.id} className="text-sm text-calm">
                            ← {rel.type} {rel.label && `(${rel.label})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
