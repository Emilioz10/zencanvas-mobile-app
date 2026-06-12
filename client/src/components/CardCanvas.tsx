/**
 * CardCanvas — Obsidian/Miro-style visual card canvas using ReactFlow v12.
 *
 * Key design decisions to avoid infinite loops:
 * - Nodes and edges are passed as CONTROLLED props (not via useNodesState).
 * - Local drag-position overrides are kept in a separate Map ref.
 * - The `data.onClick` callback is stored in a ref to avoid recreating nodes on every render.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type NodeTypes,
  Handle,
  Position,
  Panel,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Colour palette per node type ────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  task:    { bg: "#eff6ff", border: "#3b82f6", badge: "#dbeafe" },
  note:    { bg: "#f0fdf4", border: "#22c55e", badge: "#dcfce7" },
  project: { bg: "#faf5ff", border: "#a855f7", badge: "#f3e8ff" },
  person:  { bg: "#fff7ed", border: "#f97316", badge: "#ffedd5" },
  event:   { bg: "#fef2f2", border: "#ef4444", badge: "#fee2e2" },
  idea:    { bg: "#fefce8", border: "#eab308", badge: "#fef9c3" },
};

const STATUS_DOTS: Record<string, string> = {
  inbox:       "#94a3b8",
  next:        "#3b82f6",
  in_progress: "#f97316",
  done:        "#22c55e",
  someday:     "#a855f7",
  blocked:     "#ef4444",
};

// ─── Card node renderer ───────────────────────────────────────────────────────
function CardNode({ data }: { data: Record<string, unknown> }) {
  const type = (data.type as string) ?? "note";
  const colors = TYPE_COLORS[type] ?? TYPE_COLORS.note;
  const statusColor = STATUS_DOTS[(data.status as string) ?? ""] ?? "#94a3b8";
  const isRTL = data.language === "he";
  const tags = (data.tags as string[]) ?? [];

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 12,
        minWidth: 200,
        maxWidth: 260,
        boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
        cursor: "default",
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      <Handle type="target" position={Position.Left}  style={{ background: colors.border, width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: colors.border, width: 10, height: 10 }} />

      {/* Coloured header strip */}
      <div
        style={{
          background: colors.border,
          borderRadius: "10px 10px 0 0",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {type}
        </span>
        {!!data.status && (
          <span
            style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, border: "1.5px solid rgba(255,255,255,0.6)", flexShrink: 0 }}
            title={String(data.status)}
          />
        )}
      </div>

      {/* Body */}
      <div
        style={{ padding: "10px 12px 12px", cursor: "pointer" }}
        onDoubleClick={() => (data.onClick as () => void)?.()}
      >
        <p
          style={{
            fontSize: 13, fontWeight: 500, color: "#1e293b",
            lineHeight: 1.45, margin: 0, wordBreak: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {String(data.label ?? "")}
        </p>

        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} style={{ background: colors.badge, color: colors.border, borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 600 }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

          {!!data.dueDate && (
          <p style={{ fontSize: 10, color: "#64748b", margin: "6px 0 0" }}>📅 {String(data.dueDate)}</p>
        )}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = { card: CardNode };

// ─── Main component ───────────────────────────────────────────────────────────
interface CardCanvasProps {
  visibleTypes?: string[];
}

const COLS = 4;
const GAP_X = 300;
const GAP_Y = 220;

export function CardCanvas({ visibleTypes }: CardCanvasProps) {
  const [, setLocation] = useLocation();
  const { data: rawNodes = [] } = trpc.nodes.list.useQuery({});
  const { data: rawEdges = [], refetch: refetchEdges } = trpc.relationships.all.useQuery();
  const updateNodePos = trpc.nodes.update.useMutation();
  const createRelMutation = trpc.relationships.create.useMutation();

  // Local position overrides (updated on drag, without re-computing all nodes)
  const posOverrides = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Build nodes from DB data — recomputed only when rawNodes / visibleTypes change
  const baseNodes = useMemo<Node[]>(() => {
    const filtered = visibleTypes
      ? rawNodes.filter((n) => visibleTypes.includes(n.type))
      : rawNodes;

    return filtered.map((n, i) => {
      const tags = n.tags ? n.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      let dueDate = "";
      try { dueDate = n.properties ? (JSON.parse(n.properties).dueDate ?? "") : ""; } catch {}

      const override = posOverrides.current.get(String(n.id));
      const hasDbPos = (n.canvasX ?? 0) !== 0 || (n.canvasY ?? 0) !== 0;
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      const position = override
        ?? (hasDbPos ? { x: n.canvasX!, y: n.canvasY! } : { x: col * GAP_X + 40, y: row * GAP_Y + 40 });

      return {
        id: String(n.id),
        type: "card",
        position,
        data: {
          label: n.body?.slice(0, 120) || "(empty)",
          type: n.type,
          status: n.status,
          tags,
          dueDate,
          language: n.language || "en",
          // onClick stored as value — CardNode reads it from data, no closure over setLocation
          onClick: () => setLocation(`/node/${n.id}`),
        },
      };
    });
    // setLocation is stable from wouter, safe to exclude
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawNodes, visibleTypes]);

  // Build edges
  const rfEdges = useMemo<Edge[]>(() => rawEdges.map((r) => ({
    id: String(r.id),
    source: String(r.fromNodeId),
    target: String(r.toNodeId),
    label: r.label || r.type,
    type: "smoothstep",
    animated: r.type === "blocks" || r.type === "depends_on",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
    style: { stroke: "#6366f1", strokeWidth: 2 },
    labelStyle: { fill: "#4f46e5", fontWeight: 600, fontSize: 11 },
    labelBgStyle: { fill: "#eef2ff", fillOpacity: 0.9 },
    labelBgPadding: [4, 6] as [number, number],
    labelBgBorderRadius: 4,
  })), [rawEdges]);

  // Local node state for drag (position only) — separate from DB-derived baseNodes
  const [localNodes, setLocalNodes] = useState<Node[]>([]);
  const prevBaseRef = useRef<Node[]>([]);

  // Sync baseNodes → localNodes only when baseNodes reference changes
  if (prevBaseRef.current !== baseNodes) {
    prevBaseRef.current = baseNodes;
    setLocalNodes(baseNodes);
  }

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setLocalNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const [localEdges, setLocalEdges] = useState<Edge[]>([]);
  const prevEdgesRef = useRef<Edge[]>([]);
  if (prevEdgesRef.current !== rfEdges) {
    prevEdgesRef.current = rfEdges;
    setLocalEdges(rfEdges);
  }

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setLocalEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // Persist position after drag ends
  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      posOverrides.current.set(node.id, { x: node.position.x, y: node.position.y });
      updateNodePos.mutate({
        id: parseInt(node.id),
        canvasX: Math.round(node.position.x),
        canvasY: Math.round(node.position.y),
      });
    },
    [updateNodePos]
  );

  // Create relationship when user draws a connection
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;
      try {
        await createRelMutation.mutateAsync({
          fromNodeId: parseInt(params.source),
          toNodeId: parseInt(params.target),
          type: "related_to",
          label: "related to",
        });
        toast.success("🔗 חיבור נוצר");
        refetchEdges();
      } catch {
        toast.error("שגיאה ביצירת חיבור");
      }
    },
    [createRelMutation, refetchEdges]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={localNodes}
        edges={localEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop as any}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
          style: { stroke: "#6366f1", strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e2e8f0" gap={24} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => TYPE_COLORS[(n.data as any)?.type ?? "note"]?.border ?? "#94a3b8"}
          style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}
        />
        <Panel position="top-left">
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              color: "#64748b",
              backdropFilter: "blur(4px)",
            }}
          >
            <strong style={{ color: "#1e293b" }}>{localNodes.length}</strong> כרטיסיות ·{" "}
            <strong style={{ color: "#1e293b" }}>{localEdges.length}</strong> חיבורים
            <br />
            <span style={{ fontSize: 11 }}>לחץ פעמיים לעריכה · גרור ידית לחיבור</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
