import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const PASTEL_COLORS = [
  { name: "Yellow", hex: "#fef3c7" },
  { name: "Blue", hex: "#bfdbfe" },
  { name: "Pink", hex: "#fbcfe8" },
  { name: "Green", hex: "#bbf7d0" },
  { name: "Purple", hex: "#e9d5ff" },
  { name: "Peach", hex: "#fed7aa" },
];

const NODE_TYPES = ["task", "note", "project", "person", "event", "idea", "life_skill", "memory", "goal", "question"];
const STATUSES = ["inbox", "next", "someday", "done", "blocked", "in_progress"];
const EFFORTS = ["easy", "medium", "hard"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const RELATIONSHIP_TYPES = ["friend", "family", "mentor", "support", "colleague", "acquaintance"];

export default function EnhancedNodeEditor() {
  const { user } = useAuth();
  const params = useParams();
  const nodeId = parseInt(params.id as string);

  const { data: node, isLoading } = trpc.nodes.getById.useQuery({ id: nodeId });
  const { data: lifeDomains } = trpc.lifeDomains.list.useQuery();
  const { data: metadata } = trpc.nodeMetadata.getByNodeId.useQuery({ nodeId });
  const { data: dependencies } = trpc.taskDependencies.getByNodeId.useQuery({ nodeId });

  const [body, setBody] = useState("");
  const [type, setType] = useState("note");
  const [status, setStatus] = useState("inbox");
  const [tags, setTags] = useState("");
  const [selectedColor, setSelectedColor] = useState("#f3f4f6");
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [effort, setEffort] = useState("medium");
  const [priority, setPriority] = useState("medium");
  const [relationshipType, setRelationshipType] = useState("");
  const [limitations, setLimitations] = useState("");
  const [supportNeeded, setSupportNeeded] = useState("");
  const [showGuideDialog, setShowGuideDialog] = useState(false);
  const [showDependencyDialog, setShowDependencyDialog] = useState(false);

  useEffect(() => {
    if (node) {
      setBody(node.body || "");
      setType(node.type);
      setStatus(node.status || "inbox");
      setTags(node.tags || "");
    }
    if (metadata) {
      setSelectedColor(metadata.color || "#f3f4f6");
      setSelectedDomain(metadata.lifeDomainId || null);
      setEffort(metadata.effort || "medium");
      setPriority(metadata.priority || "medium");
      setRelationshipType(metadata.relationshipType || "");
      setLimitations(metadata.limitations || "");
      setSupportNeeded(metadata.supportNeeded || "");
    }
  }, [node, metadata]);

  const updateMutation = trpc.nodes.update.useMutation();
  const updateMetadataMutation = trpc.nodeMetadata.update.useMutation();

  const handleUpdate = async () => {
    try {
      await updateMutation.mutateAsync({
        id: nodeId,
        body,
        type,
        status,
        tags,
      });

      await updateMetadataMutation.mutateAsync({
        nodeId,
        color: selectedColor,
        lifeDomainId: selectedDomain,
        effort,
        priority,
        relationshipType,
        limitations,
        supportNeeded,
      });

      toast.success("Node updated successfully");
    } catch (error) {
      toast.error("Failed to update node");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Node</h1>

      {/* Color Selection */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Select Color</h2>
        <div className="flex gap-4 flex-wrap">
          {PASTEL_COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => setSelectedColor(color.hex)}
              className={`w-16 h-16 rounded-full border-4 transition-all ${
                selectedColor === color.hex ? "border-gray-800" : "border-gray-300"
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </Card>

      {/* Project/Domain Link */}
      <Card className="p-6">
        <Label className="text-base font-semibold mb-3 block">Life Domain</Label>
        <Select value={selectedDomain?.toString() || ""} onValueChange={(v) => setSelectedDomain(v ? parseInt(v) : null)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a life domain..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No Domain</SelectItem>
            {lifeDomains?.map((domain) => (
              <SelectItem key={domain.id} value={domain.id.toString()}>
                {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Add Date */}
      <Card className="p-6">
        <Button variant="outline" className="w-full">
          📅 Add Date
        </Button>
      </Card>

      {/* Convert to Task / Note */}
      <Card className="p-6 flex gap-4">
        <Button
          className="flex-1 bg-teal-500 hover:bg-teal-600"
          onClick={() => setType("task")}
        >
          ✓ Convert to Task
        </Button>
        <Button
          className="flex-1 bg-orange-500 hover:bg-orange-600"
          onClick={() => setType("note")}
        >
          📝 Convert to Note
        </Button>
      </Card>

      {/* Add Connection */}
      <Card className="p-6">
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
          ↗ Add Connection
        </Button>
      </Card>

      {/* Node Properties */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Node Properties</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NODE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Effort</Label>
            <Select value={effort} onValueChange={setEffort}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EFFORTS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {type === "person" && (
          <div>
            <Label>Relationship Type</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship..." />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((rt) => (
                  <SelectItem key={rt} value={rt}>
                    {rt.charAt(0).toUpperCase() + rt.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label>Tags</Label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Separate tags with commas"
          />
        </div>

        <div>
          <Label>Limitations / Challenges</Label>
          <Textarea
            value={limitations}
            onChange={(e) => setLimitations(e.target.value)}
            placeholder="Any limitations or challenges related to this..."
            rows={3}
          />
        </div>

        <div>
          <Label>Support Needed</Label>
          <Textarea
            value={supportNeeded}
            onChange={(e) => setSupportNeeded(e.target.value)}
            placeholder="What kind of support is needed? (financial, emotional, medical, etc.)"
            rows={3}
          />
        </div>
      </Card>

      {/* Content Editor */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Content (Markdown)</h2>
        <MarkdownEditor value={body} onChange={setBody} placeholder="Write your content in Markdown..." />
      </Card>

      {/* Task Dependencies */}
      {type === "task" && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Task Dependencies</h2>
            <Button onClick={() => setShowDependencyDialog(true)} variant="outline">
              + Add Dependency
            </Button>
          </div>
          {dependencies && dependencies.length > 0 ? (
            <div className="space-y-2">
              {dependencies.map((dep) => (
                <div key={dep.id} className="p-3 bg-gray-100 rounded">
                  <p className="text-sm">Depends on: Task #{dep.dependsOnTaskId}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No dependencies yet</p>
          )}
        </Card>
      )}

      {/* Life Skills Guide */}
      {type === "life_skill" && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Life Skills Guide</h2>
            <Button onClick={() => setShowGuideDialog(true)} variant="outline">
              + Add Guide
            </Button>
          </div>
          <p className="text-gray-500">Create step-by-step guides with images and GIFs</p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">
          Update
        </Button>
      </div>
    </div>
  );
}
