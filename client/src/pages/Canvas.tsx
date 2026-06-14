/**
 * Canvas page — wraps InfiniteCanvas and wires it to tRPC data.
 */

import React, { useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { InfiniteCanvas } from "@/components/InfiniteCanvas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LayoutGrid, Filter, Plus, Loader2 } from "lucide-react";

type NodeType = "task" | "note" | "project" | "person" | "event" | "idea";

const TYPE_LABELS: Record<NodeType, string> = {
  task: "משימה",
  note: "פתק",
  project: "פרויקט",
  person: "אדם",
  event: "אירוע",
  idea: "רעיון",
};

const TYPE_COLORS: Record<NodeType, string> = {
  task: "#dbeafe",
  note: "#fef9c3",
  project: "#ede9fe",
  person: "#ffedd5",
  event: "#dcfce7",
  idea: "#fce7f3",
};

export default function Canvas() {
  const [, setLocation] = useLocation();
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [showUnlinked, setShowUnlinked] = useState(false);

  const [newNodeDialog, setNewNodeDialog] = useState<{
    open: boolean;
    type: NodeType;
    x: number;
    y: number;
  } | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeBody, setNewNodeBody] = useState("");
  const [newNodeStatus, setNewNodeStatus] = useState("todo");

  // ── Data ──
  const { data: rawNodes, refetch: refetchNodes } = trpc.nodes.list.useQuery({});
  const { data: rawEdges, refetch: refetchEdges } = trpc.relationships.all.useQuery();

  const updateNode = trpc.nodes.update.useMutation();
  const createNode = trpc.nodes.create.useMutation({ onSuccess: () => refetchNodes() });
  const createRelationship = trpc.relationships.create.useMutation({ onSuccess: () => refetchEdges() });
  const deleteRelationship = trpc.relationships.delete.useMutation({
    onSuccess: () => { setSelectedEdgeId(null); refetchEdges(); },
  });

  // ── Transform ──
  const allNodes = useMemo(() => {
    if (!rawNodes) return [];
    return (rawNodes as any[]).map((n) => {
      let title = "";
      let body = "";
      let color: string | undefined;
      let priority: string | undefined;
      if (n.properties) {
        try {
          const p = JSON.parse(n.properties);
          title = p.title ?? "";
          color = p.color;
          priority = p.priority;
        } catch { /* ignore */ }
      }
      if (n.body) {
        const lines = (n.body as string).split("\n");
        if (!title) title = lines[0].slice(0, 60);
        body = lines.slice(1).join("\n").trim() || n.body;
      }
      if (!title) title = `(${n.type})`;
      return {
        id: n.id as number,
        type: n.type as NodeType,
        title,
        body: body || undefined,
        status: n.status as any,
        priority: priority as any,
        tags: n.tags ?? undefined,
        canvasX: (n.canvasX as number) ?? 0,
        canvasY: (n.canvasY as number) ?? 0,
        color,
      };
    });
  }, [rawNodes]);

  const allEdges = useMemo(() => {
    if (!rawEdges) return [];
    return (rawEdges as any[]).map((e) => ({
      id: e.id as number,
      fromNodeId: e.fromNodeId as number,
      toNodeId: e.toNodeId as number,
      type: (e.type as string) ?? "related_to",
      label: e.label ?? undefined,
    }));
  }, [rawEdges]);

  const filteredNodes = useMemo(
    () => filterType === "all" ? allNodes : allNodes.filter((n) => n.type === filterType),
    [allNodes, filterType]
  );

  const linkedNodeIds = useMemo(() => {
    const ids = new Set<number>();
    allEdges.forEach((e) => { ids.add(e.fromNodeId); ids.add(e.toNodeId); });
    return ids;
  }, [allEdges]);

  const unlinkedNodes = useMemo(
    () => allNodes.filter((n) => !linkedNodeIds.has(n.id)),
    [allNodes, linkedNodeIds]
  );

  // ── Handlers ──
  const handleNodeMove = useCallback((id: number, x: number, y: number) => {
    updateNode.mutate({ id, canvasX: x, canvasY: y });
  }, [updateNode]);

  const handleNodeClick = useCallback((id: number) => {
    setLocation(`/node/${id}`);
  }, [setLocation]);

  const handleEdgeCreate = useCallback((fromId: number, toId: number) => {
    const exists = allEdges.some((e) => e.fromNodeId === fromId && e.toNodeId === toId);
    if (exists) { toast.info("חיבור כבר קיים"); return; }
    createRelationship.mutate({ fromNodeId: fromId, toNodeId: toId, type: "related_to" });
    toast.success("חיבור נוצר");
  }, [allEdges, createRelationship]);

  const handleEdgeDelete = useCallback((edgeId: number) => {
    deleteRelationship.mutate({ id: edgeId });
    toast.success("חיבור נמחק");
  }, [deleteRelationship]);

  const handleAddNode = useCallback((type: NodeType, x: number, y: number) => {
    setNewNodeTitle("");
    setNewNodeBody("");
    setNewNodeStatus("todo");
    setNewNodeDialog({ open: true, type, x, y });
  }, []);

  const handleCreateNode = useCallback(() => {
    if (!newNodeDialog || !newNodeTitle.trim()) return;
    const props = JSON.stringify({ title: newNodeTitle.trim() });
    createNode.mutate(
      { type: newNodeDialog.type, body: newNodeBody || newNodeTitle, properties: props, status: newNodeStatus },
      {
        onSuccess: (result: any) => {
          if (result?.id) {
            updateNode.mutate({ id: result.id, canvasX: Math.round(newNodeDialog.x), canvasY: Math.round(newNodeDialog.y) });
          }
          setNewNodeDialog(null);
          toast.success("פריט נוצר");
        },
      }
    );
  }, [newNodeDialog, newNodeTitle, newNodeBody, newNodeStatus, createNode, updateNode]);

  const isLoading = !rawNodes || !rawEdges;

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid #e2e8f0", background: "white", flexShrink: 0 }}>
          <LayoutGrid size={18} style={{ color: "#6366f1" }} />
          <span style={{ fontWeight: 600, fontSize: 15, color: "#1e293b" }}>קאנבס</span>
          <div style={{ flex: 1 }} />

          {/* Type filter pills */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "task", "note", "project", "idea"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: "3px 10px", borderRadius: 999, border: "1px solid",
                  borderColor: filterType === t ? "#6366f1" : "#e2e8f0",
                  background: filterType === t ? "#6366f1" : "white",
                  color: filterType === t ? "white" : "#64748b",
                  fontSize: 12, cursor: "pointer", fontWeight: 500,
                }}
              >
                {t === "all" ? "הכל" : TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowUnlinked((v) => !v)} style={{ gap: 4 }}>
            <Filter size={14} />
            לא מקושרים
            {unlinkedNodes.length > 0 && (
              <Badge variant="secondary" style={{ marginLeft: 2 }}>{unlinkedNodes.length}</Badge>
            )}
          </Button>
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
          <div style={{ flex: 1, position: "relative" }}>
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, color: "#94a3b8" }}>
                <Loader2 size={20} className="animate-spin" />
                <span>טוען קאנבס...</span>
              </div>
            ) : (
              <InfiniteCanvas
                nodes={filteredNodes}
                edges={allEdges}
                onNodeMove={handleNodeMove}
                onNodeClick={handleNodeClick}
                onEdgeCreate={handleEdgeCreate}
                onEdgeDelete={handleEdgeDelete}
                onAddNode={handleAddNode as any}
                selectedNodeId={selectedNodeId}
                selectedEdgeId={selectedEdgeId}
                onSelectNode={setSelectedNodeId}
                onSelectEdge={setSelectedEdgeId}
              />
            )}
          </div>

          {/* Unlinked panel */}
          {showUnlinked && (
            <div style={{ width: 240, borderLeft: "1px solid #e2e8f0", background: "white", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: 13, color: "#475569" }}>
                לא מקושרים ({unlinkedNodes.length})
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
                {unlinkedNodes.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 24 }}>כל הפריטים מקושרים ✓</div>
                ) : (
                  unlinkedNodes.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => setLocation(`/node/${node.id}`)}
                      style={{
                        padding: "8px 10px", borderRadius: 8, marginBottom: 4,
                        background: TYPE_COLORS[node.type] ?? "#f3f4f6",
                        cursor: "pointer", fontSize: 12, color: "#1e293b", fontWeight: 500,
                        border: "1px solid rgba(0,0,0,0.06)",
                        direction: /[\u0590-\u05FF]/.test(node.title) ? "rtl" : "ltr",
                      }}
                    >
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.title}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{TYPE_LABELS[node.type] ?? node.type} · #{node.id}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New node dialog */}
      <Dialog open={newNodeDialog?.open ?? false} onOpenChange={(open) => !open && setNewNodeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newNodeDialog?.type === "note" ? "פתק חדש 📝" : "משימה חדשה ✅"}</DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Label>כותרת *</Label>
              <Input
                autoFocus value={newNodeTitle}
                onChange={(e) => setNewNodeTitle(e.target.value)}
                placeholder={newNodeDialog?.type === "note" ? "כותרת הפתק..." : "שם המשימה..."}
                onKeyDown={(e) => e.key === "Enter" && handleCreateNode()}
                dir="auto"
              />
            </div>
            {newNodeDialog?.type === "task" && (
              <div>
                <Label>סטטוס</Label>
                <Select value={newNodeStatus} onValueChange={setNewNodeStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">לביצוע</SelectItem>
                    <SelectItem value="in_progress">בתהליך</SelectItem>
                    <SelectItem value="done">הושלם</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>תוכן (אופציונלי)</Label>
              <Textarea value={newNodeBody} onChange={(e) => setNewNodeBody(e.target.value)} placeholder="הוסף תוכן..." rows={3} dir="auto" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewNodeDialog(null)}>ביטול</Button>
            <Button onClick={handleCreateNode} disabled={!newNodeTitle.trim() || createNode.isPending}>
              {createNode.isPending ? <Loader2 size={14} className="animate-spin" style={{ marginRight: 4 }} /> : <Plus size={14} style={{ marginRight: 4 }} />}
              צור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
