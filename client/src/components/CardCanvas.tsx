import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Handle,
  Position,
  Panel,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// ─── Type colours ────────────────────────────────────────────────────────────
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

// ─── Card node component ──────────────────────────────────────────────────────
function CardNode({ data }: { data: any }) {
  const colors = TYPE_COLORS[data.type] ?? TYPE_COLORS.note;
  const statusColor = STATUS_DOTS[data.status] ?? "#94a3b8";
  const isRTL = data.language === "he";

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 12,
        minWidth: 200,
        maxWidth: 260,
        boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
        cursor: "pointer",
        direction: isRTL ? "rtl" : "ltr",
      }}
      onClick={data.onClick}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Left} style={{ background: colors.border, width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: colors.border, width: 10, height: 10 }} />

      {/* Card header */}
      <div
        style={{
          background: colors.border,
          borderRadius: "10px 10px 0 0",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {data.type}
        </span>
        {data.status && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: statusColor,
              border: "1.5px solid rgba(255,255,255,0.6)",
              flexShrink: 0,
            }}
            title={data.status}
          />
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "10px 12px 12px" }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#1e293b",
            lineHeight: 1.45,
            margin: 0,
            wordBreak: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {data.label}
        </p>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {data.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                style={{
                  background: colors.badge,
                  color: colors.border,
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Due date */}
        {data.dueDate && (
          <p style={{ fontSize: 10, color: "#64748b", marginTop: 6, margin: "6px 0 0" }}>
            📅 {data.dueDate}
          </p>
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

export function CardCanvas({ visibleTypes }: CardCanvasProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: rawNodes = [], refetch: refetchNodes } = trpc.nodes.list.useQuery({});
  const { data: rawEdges = [], refetch: refetchEdges } = trpc.relationships.all.useQuery();
  const updateNodePos = trpc.nodes.update.useMutation();
  const createRelMutation = trpc.relationships.create.useMutation();

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Convert DB nodes → ReactFlow nodes
  useEffect(() => {
    const filtered = visibleTypes
      ? rawNodes.filter((n) => visibleTypes.includes(n.type))
      : rawNodes;

    // Auto-layout: arrange in a grid if no saved position
    const COLS = 4;
    const GAP_X = 300;
    const GAP_Y = 220;

    const converted: Node[] = filtered.map((n, i) => {
      let tags: string[] = [];
      try {
        tags = n.tags ? n.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      } catch {}

      let dueDate = "";
      try {
        const props = n.properties ? JSON.parse(n.properties) : {};
        dueDate = props.dueDate || "";
      } catch {}

      const hasPos = n.canvasX !== 0 || n.canvasY !== 0;
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      return {
        id: String(n.id),
        type: "card",
        position: hasPos
          ? { x: n.canvasX ?? col * GAP_X + 40, y: n.canvasY ?? row * GAP_Y + 40 }
          : { x: col * GAP_X + 40, y: row * GAP_Y + 40 },
        data: {
          label: n.body?.slice(0, 120) || "(empty)",
          type: n.type,
          status: n.status,
          tags,
          dueDate,
          language: n.language || "en",
          onClick: () => setLocation(`/node/${n.id}`),
        },
      };
    });

    setRfNodes(converted);
  }, [rawNodes, visibleTypes, setLocation]);

  // Convert DB relationships → ReactFlow edges
  useEffect(() => {
    const converted: Edge[] = rawEdges.map((r) => ({
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
    }));
    setRfEdges(converted);
  }, [rawEdges]);

  // Persist card position on drag end
  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      updateNodePos.mutate({
        id: parseInt(node.id),
        canvasX: Math.round(node.position.x),
        canvasY: Math.round(node.position.y),
      });
    },
    [updateNodePos]
  ) as any;

  // Create relationship when user connects two cards
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
        toast.success("🔗 Connection created");
        refetchEdges();
      } catch {
        toast.error("Failed to create connection");
      }
    },
    [createRelMutation, refetchEdges]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
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
          nodeColor={(n) => {
            const type = (n.data as any)?.type ?? "note";
            return TYPE_COLORS[type]?.border ?? "#94a3b8";
          }}
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
            <strong style={{ color: "#1e293b" }}>{rfNodes.length}</strong> כרטיסיות ·{" "}
            <strong style={{ color: "#1e293b" }}>{rfEdges.length}</strong> חיבורים
            <br />
            <span style={{ fontSize: 11 }}>גרור כרטיסייה להזזה · חבר ידיות לקישור</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
