/**
 * JsonCanvas — JSON Canvas spec-compliant infinite canvas
 *
 * Node types (per spec):
 *   text    — Markdown text card (sticky note style)
 *   file    — Image or document attachment card
 *   link    — URL card with Open Graph preview
 *   group   — Visual container with label and optional background
 *   flashcard — Mochi-style front/back flip card
 *   task    — Task card with status, priority, checklist
 *
 * Edges: colored bezier arrows with fromSide/toSide/fromEnd/toEnd
 * Colors: 6 presets (1=red 2=orange 3=yellow 4=green 5=cyan 6=purple) + hex
 *
 * Touch-native: pinch-zoom, two-finger pan, drag cards, tap to edit
 */
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CanvasNode {
  id: number;
  type: string;
  canvasNodeType: string | null;
  body: string | null;
  tags: string | null;
  status: string | null;
  canvasX: number;
  canvasY: number;
  canvasWidth: number;
  canvasHeight: number;
  cardColor: string | null;
  canvasColor: string | null;
  canvasZIndex: number | null;
  canvasUrl: string | null;
  canvasLabel: string | null;
  canvasBackground: string | null;
  canvasBackgroundStyle: string | null;
  flashcardBack: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  language: string | null;
}

interface CanvasEdge {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  type: string;
  label: string | null;
  edgeColor: string | null;
  fromSide: string | null;
  toSide: string | null;
  fromEnd: string | null;
  toEnd: string | null;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

// ─── Canvas color presets (JSON Canvas spec) ──────────────────────────────────
const PRESET_COLORS: Record<string, string> = {
  "1": "#ef4444", // red
  "2": "#f97316", // orange
  "3": "#eab308", // yellow
  "4": "#22c55e", // green
  "5": "#06b6d4", // cyan
  "6": "#a855f7", // purple
};

function resolveColor(c: string | null | undefined, fallback = "#e2e8f0"): string {
  if (!c) return fallback;
  if (PRESET_COLORS[c]) return PRESET_COLORS[c];
  return c;
}

// Node type → default background color
const NODE_BG: Record<string, string> = {
  text: "#fef9c3",
  note: "#fef9c3",
  file: "#f0fdf4",
  image: "#f0fdf4",
  link: "#eff6ff",
  group: "rgba(148,163,184,0.08)",
  flashcard: "#fdf4ff",
  task: "#dbeafe",
  project: "#ede9fe",
  person: "#fce7f3",
  event: "#dcfce7",
  idea: "#ffedd5",
  document: "#f8fafc",
};

const STATUS_DOT: Record<string, string> = {
  done: "#22c55e",
  in_progress: "#3b82f6",
  blocked: "#ef4444",
  inbox: "#94a3b8",
  next: "#f59e0b",
  someday: "#a78bfa",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isRTL(text: string | null): boolean {
  if (!text) return false;
  return /[\u0590-\u05FF\u0600-\u06FF]/.test(text.slice(0, 80));
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ─── Edge anchor point ────────────────────────────────────────────────────────
function getAnchor(
  node: CanvasNode,
  side: string | null | undefined
): [number, number] {
  const cx = node.canvasX + node.canvasWidth / 2;
  const cy = node.canvasY + (node.canvasHeight || 120) / 2;
  switch (side) {
    case "top": return [cx, node.canvasY];
    case "bottom": return [cx, node.canvasY + (node.canvasHeight || 120)];
    case "left": return [node.canvasX, cy];
    case "right": return [node.canvasX + node.canvasWidth, cy];
    default: return [node.canvasX + node.canvasWidth, cy]; // default right
  }
}

// ─── SVG bezier edge ──────────────────────────────────────────────────────────
function EdgePath({
  edge,
  fromNode,
  toNode,
}: {
  edge: CanvasEdge;
  fromNode: CanvasNode;
  toNode: CanvasNode;
}) {
  const [fx, fy] = getAnchor(fromNode, edge.fromSide);
  const [tx, ty] = getAnchor(toNode, edge.toSide ?? "left");
  const dx = Math.abs(tx - fx) * 0.5;
  const path = `M ${fx} ${fy} C ${fx + dx} ${fy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
  const color = resolveColor(edge.edgeColor, "#6366f1");
  const markerId = `arrow-${edge.id}`;
  const showFromArrow = edge.fromEnd === "arrow";
  const showToArrow = edge.toEnd !== "none";

  return (
    <g>
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
        {showFromArrow && (
          <marker
            id={`${markerId}-from`}
            markerWidth="8"
            markerHeight="8"
            refX="2"
            refY="3"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L0,6 L8,3 z" fill={color} />
          </marker>
        )}
      </defs>
      {/* Hit area */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={12} />
      {/* Visible line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        markerEnd={showToArrow ? `url(#${markerId})` : undefined}
        markerStart={showFromArrow ? `url(#${markerId}-from)` : undefined}
        strokeDasharray={edge.type === "blocked_by" ? "6 3" : undefined}
      />
      {edge.label && (
        <text
          x={(fx + tx) / 2}
          y={(fy + ty) / 2 - 6}
          textAnchor="middle"
          fontSize={11}
          fill={color}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

// ─── Card renderers ───────────────────────────────────────────────────────────
function TextCard({ node, onTap }: { node: CanvasNode; onTap: () => void }) {
  const bg = resolveColor(node.canvasColor, node.cardColor ?? NODE_BG.text);
  const dir = isRTL(node.body) ? "rtl" : "ltr";
  return (
    <div
      className="canvas-card text-card"
      style={{ background: bg, direction: dir, width: "100%", height: "100%" }}
      onPointerUp={(e) => { e.stopPropagation(); onTap(); }}
    >
      <div className="card-body" style={{ fontSize: 13, whiteSpace: "pre-wrap", overflowY: "auto", maxHeight: "100%", padding: "10px 12px" }}>
        {node.body || <span style={{ opacity: 0.4 }}>Tap to edit…</span>}
      </div>
    </div>
  );
}

function TaskCard({ node, onTap }: { node: CanvasNode; onTap: () => void }) {
  const bg = resolveColor(node.canvasColor, node.cardColor ?? NODE_BG.task);
  const statusColor = STATUS_DOT[node.status ?? "inbox"] ?? "#94a3b8";
  const dir = isRTL(node.body) ? "rtl" : "ltr";
  return (
    <div
      className="canvas-card task-card"
      style={{ background: bg, direction: dir, width: "100%", height: "100%" }}
      onPointerUp={(e) => { e.stopPropagation(); onTap(); }}
    >
      <div style={{ padding: "8px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.body?.split("\n")[0] || "Untitled task"}
          </span>
        </div>
        {node.tags && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
            {node.tags.split(",").slice(0, 3).map(t => (
              <span key={t} style={{ fontSize: 10, background: "rgba(0,0,0,0.08)", borderRadius: 4, padding: "1px 5px" }}>
                {t.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileCard({ node, onTap }: { node: CanvasNode; onTap: () => void }) {
  const bg = resolveColor(node.canvasColor, node.cardColor ?? NODE_BG.file);
  const isImage = node.attachmentType === "image" || node.canvasNodeType === "file";
  return (
    <div
      className="canvas-card file-card"
      style={{ background: bg, width: "100%", height: "100%", overflow: "hidden" }}
      onPointerUp={(e) => { e.stopPropagation(); onTap(); }}
    >
      {node.attachmentUrl && isImage ? (
        <img
          src={node.attachmentUrl}
          alt={node.attachmentName ?? "image"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          draggable={false}
        />
      ) : node.attachmentUrl ? (
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
          <span style={{ fontSize: 32 }}>📄</span>
          <span style={{ fontSize: 12, textAlign: "center", wordBreak: "break-word" }}>{node.attachmentName ?? "Document"}</span>
        </div>
      ) : (
        <div style={{ padding: 12, opacity: 0.5, fontSize: 12, textAlign: "center", paddingTop: 20 }}>
          Tap to attach file
        </div>
      )}
    </div>
  );
}

function LinkCard({ node, onTap }: { node: CanvasNode; onTap: () => void }) {
  const bg = resolveColor(node.canvasColor, node.cardColor ?? NODE_BG.link);
  const url = node.canvasUrl ?? node.body ?? "";
  let hostname = "";
  try { hostname = new URL(url).hostname; } catch {}
  return (
    <div
      className="canvas-card link-card"
      style={{ background: bg, width: "100%", height: "100%", padding: "10px 12px" }}
      onPointerUp={(e) => { e.stopPropagation(); onTap(); }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>🔗</span>
        <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {hostname || "Link"}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#374151", wordBreak: "break-all", opacity: 0.8 }}>
        {url.slice(0, 80)}{url.length > 80 ? "…" : ""}
      </div>
    </div>
  );
}

function FlashCard({ node, onTap }: { node: CanvasNode; onTap: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const bg = resolveColor(node.canvasColor, node.cardColor ?? NODE_BG.flashcard);
  const dir = isRTL(node.body) ? "rtl" : "ltr";
  return (
    <div
      className="canvas-card flashcard"
      style={{ background: bg, width: "100%", height: "100%", perspective: 600 }}
      onPointerUp={(e) => { e.stopPropagation(); setFlipped(f => !f); }}
    >
      <div style={{
        width: "100%", height: "100%",
        transition: "transform 0.4s",
        transformStyle: "preserve-3d",
        transform: flipped ? "rotateY(180deg)" : "none",
        position: "relative",
      }}>
        {/* Front */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          padding: "10px 12px", direction: dir, display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Question</div>
          <div style={{ fontSize: 13 }}>{node.body || "Tap to edit"}</div>
          <div style={{ marginTop: "auto", fontSize: 10, opacity: 0.4 }}>Tap to flip ↩</div>
        </div>
        {/* Back */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          padding: "10px 12px", direction: dir, display: "flex", flexDirection: "column", justifyContent: "center",
          background: "#fdf4ff",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Answer</div>
          <div style={{ fontSize: 13 }}>{node.flashcardBack || "No answer yet"}</div>
          <div style={{ marginTop: "auto", fontSize: 10, opacity: 0.4 }}>Tap to flip ↩</div>
        </div>
      </div>
    </div>
  );
}

function GroupCard({ node, onTap }: { node: CanvasNode; onTap: () => void }) {
  const bg = resolveColor(node.canvasColor, "rgba(148,163,184,0.08)");
  const borderColor = resolveColor(node.canvasColor, "#cbd5e1");
  return (
    <div
      className="canvas-card group-card"
      style={{
        background: bg,
        border: `2px dashed ${borderColor}`,
        borderRadius: 12,
        width: "100%", height: "100%",
      }}
      onPointerUp={(e) => { e.stopPropagation(); onTap(); }}
    >
      {node.canvasLabel && (
        <div style={{
          position: "absolute", top: -14, left: 12,
          background: "#fff", border: `1.5px solid ${borderColor}`,
          borderRadius: 6, padding: "2px 8px",
          fontSize: 11, fontWeight: 600, color: "#475569",
        }}>
          {node.canvasLabel}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function JsonCanvas() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Data
  const { data: allNodes, refetch: refetchNodes } = trpc.nodes.list.useQuery(
    {},
    { enabled: !!user }
  );
  const { data: allEdges, refetch: refetchEdges } = trpc.relationships.all.useQuery(
    undefined,
    { enabled: !!user }
  );

  const updateNode = trpc.nodes.update.useMutation();
  const createNode = trpc.nodes.create.useMutation();
  const deleteNode = trpc.nodes.delete.useMutation();
  const createEdge = trpc.relationships.create.useMutation();
  const deleteEdge = trpc.relationships.delete.useMutation();

  // Canvas transform
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Interaction state
  const [activeTool, setActiveTool] = useState<"select" | "text" | "task" | "link" | "group" | "flashcard" | "file">("select");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null);
  const [connectLine, setConnectLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Edit sheet state
  const [editNode, setEditNode] = useState<CanvasNode | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editStatus, setEditStatus] = useState("inbox");

  // Create sheet
  const [showCreate, setShowCreate] = useState(false);
  const [createPos, setCreatePos] = useState({ x: 100, y: 100 });
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newStatus, setNewStatus] = useState("inbox");
  const [newColor, setNewColor] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newBack, setNewBack] = useState("");

  // Import/export
  const fileInputRef = useRef<HTMLInputElement>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Pointer tracking for pan/pinch
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const panStartRef = useRef<{ px: number; py: number; tx: number; ty: number } | null>(null);

  // Drag state
  const dragRef = useRef<{
    nodeId: number;
    startX: number; startY: number;
    origX: number; origY: number;
    moved: boolean;
  } | null>(null);

  // ── Filtered nodes ──────────────────────────────────────────────────────────
  const nodes: CanvasNode[] = useMemo(() => {
    const raw = (allNodes ?? []) as CanvasNode[];
    if (!filterType) return raw;
    return raw.filter(n => (n.canvasNodeType ?? n.type) === filterType);
  }, [allNodes, filterType]);

  const nodeMap = useMemo(() => {
    const m = new Map<number, CanvasNode>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  const edges: CanvasEdge[] = useMemo(() => (allEdges ?? []) as CanvasEdge[], [allEdges]);

  // ── Canvas → screen coordinate helpers ─────────────────────────────────────
  const toScreen = useCallback((cx: number, cy: number) => {
    const t = transformRef.current;
    return { x: cx * t.scale + t.x, y: cy * t.scale + t.y };
  }, []);

  const toCanvas = useCallback((sx: number, sy: number) => {
    const t = transformRef.current;
    return { x: (sx - t.x) / t.scale, y: (sy - t.y) / t.scale };
  }, []);

  const getCanvasRect = useCallback(() => {
    return canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
  }, []);

  // ── Pointer events on the canvas background ─────────────────────────────────
  const onCanvasPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".canvas-card")) return;
    if ((e.target as HTMLElement).closest(".toolbar")) return;

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (pointersRef.current.size === 1) {
      // Single finger: pan
      panStartRef.current = {
        px: e.clientX, py: e.clientY,
        tx: transformRef.current.x, ty: transformRef.current.y,
      };
    }
  }, []);

  const onCanvasPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      // Pinch-zoom
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinchDistRef.current !== null) {
        const ratio = dist / lastPinchDistRef.current;
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const rect = getCanvasRect();
        const cx = midX - rect.left;
        const cy = midY - rect.top;
        setTransform(t => {
          const newScale = clamp(t.scale * ratio, 0.1, 5);
          const scaleDiff = newScale - t.scale;
          return {
            x: t.x - (cx - t.x) * (scaleDiff / t.scale),
            y: t.y - (cy - t.y) * (scaleDiff / t.scale),
            scale: newScale,
          };
        });
      }
      lastPinchDistRef.current = dist;
      panStartRef.current = null;
    } else if (pointersRef.current.size === 1 && panStartRef.current) {
      // Pan
      const dx = e.clientX - panStartRef.current.px;
      const dy = e.clientY - panStartRef.current.py;
      setTransform(t => ({ ...t, x: panStartRef.current!.tx + dx, y: panStartRef.current!.ty + dy }));
    }

    // Draw connection line
    if (connectingFrom !== null) {
      const rect = getCanvasRect();
      setConnectLine(prev => prev ? { ...prev, x2: e.clientX - rect.left, y2: e.clientY - rect.top } : null);
    }
  }, [connectingFrom, getCanvasRect]);

  const onCanvasPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    lastPinchDistRef.current = null;
    panStartRef.current = null;

    // Tap on empty canvas → create node
    if (activeTool !== "select" && connectingFrom === null) {
      const rect = getCanvasRect();
      const pos = toCanvas(e.clientX - rect.left, e.clientY - rect.top);
      setCreatePos(pos);
      setNewTitle("");
      setNewBody("");
      setNewStatus("inbox");
      setNewColor("");
      setNewUrl("");
      setNewBack("");
      setShowCreate(true);
    }
  }, [activeTool, connectingFrom, toCanvas, getCanvasRect]);

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(t => {
        const newScale = clamp(t.scale * delta, 0.1, 5);
        const scaleDiff = newScale - t.scale;
        return {
          x: t.x - (cx - t.x) * (scaleDiff / t.scale),
          y: t.y - (cy - t.y) * (scaleDiff / t.scale),
          scale: newScale,
        };
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // ── Card drag ───────────────────────────────────────────────────────────────
  const onCardPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>, nodeId: number) => {
    if ((e.target as HTMLElement).closest(".connect-handle")) return;
    e.stopPropagation();
    const node = nodeMap.get(nodeId);
    if (!node) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      nodeId,
      startX: e.clientX, startY: e.clientY,
      origX: node.canvasX, origY: node.canvasY,
      moved: false,
    };
    setSelectedId(nodeId);
  }, [nodeMap]);

  const onCardPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / transformRef.current.scale;
    const dy = (e.clientY - dragRef.current.startY) / transformRef.current.scale;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    if (!dragRef.current.moved) return;

    const newX = dragRef.current.origX + dx;
    const newY = dragRef.current.origY + dy;

    // Optimistic update
    const nodeEl = (e.currentTarget as HTMLElement);
    nodeEl.style.transform = `translate(${newX * transformRef.current.scale + transformRef.current.x}px, ${newY * transformRef.current.scale + transformRef.current.y}px)`;
  }, []);

  const onCardPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>, nodeId: number) => {
    if (!dragRef.current || dragRef.current.nodeId !== nodeId) return;
    const { moved, origX, origY, startX, startY } = dragRef.current;
    dragRef.current = null;

    if (!moved) return; // tap handled elsewhere

    const dx = (e.clientX - startX) / transformRef.current.scale;
    const dy = (e.clientY - startY) / transformRef.current.scale;
    const newX = Math.round(origX + dx);
    const newY = Math.round(origY + dy);

    updateNode.mutate({ id: nodeId, canvasX: newX, canvasY: newY }, {
      onSuccess: () => refetchNodes(),
    });
  }, [updateNode, refetchNodes]);

  // ── Connect handle ──────────────────────────────────────────────────────────
  const onConnectHandleDown = useCallback((e: ReactPointerEvent<HTMLSpanElement>, nodeId: number) => {
    e.stopPropagation();
    const rect = getCanvasRect();
    const node = nodeMap.get(nodeId);
    if (!node) return;
    const [ax, ay] = getAnchor(node, "right");
    const sp = toScreen(ax, ay);
    setConnectingFrom(nodeId);
    setConnectLine({ x1: sp.x, y1: sp.y, x2: e.clientX - rect.left, y2: e.clientY - rect.top });
  }, [nodeMap, toScreen, getCanvasRect]);

  const onCardPointerEnter = useCallback((nodeId: number) => {
    if (connectingFrom !== null && connectingFrom !== nodeId) {
      // Highlight target
    }
  }, [connectingFrom]);

  const onCardPointerUpConnect = useCallback((e: ReactPointerEvent<HTMLDivElement>, nodeId: number) => {
    if (connectingFrom !== null && connectingFrom !== nodeId) {
      createEdge.mutate(
        { fromNodeId: connectingFrom, toNodeId: nodeId, type: "related_to", toEnd: "arrow" },
        { onSuccess: () => { refetchEdges(); toast.success("Connected!"); } }
      );
      setConnectingFrom(null);
      setConnectLine(null);
    }
  }, [connectingFrom, createEdge, refetchEdges]);

  // ── Edit sheet ──────────────────────────────────────────────────────────────
  const openEdit = useCallback((node: CanvasNode) => {
    setEditNode(node);
    setEditBody(node.body ?? "");
    setEditBack(node.flashcardBack ?? "");
    setEditUrl(node.canvasUrl ?? "");
    setEditLabel(node.canvasLabel ?? "");
    setEditColor(node.canvasColor ?? node.cardColor ?? "");
    setEditStatus(node.status ?? "inbox");
  }, []);

  const saveEdit = useCallback(() => {
    if (!editNode) return;
    updateNode.mutate({
      id: editNode.id,
      body: editBody,
      flashcardBack: editBack,
      canvasUrl: editUrl,
      canvasLabel: editLabel,
      canvasColor: editColor,
      cardColor: editColor,
      status: editStatus,
    }, { onSuccess: () => { refetchNodes(); setEditNode(null); } });
  }, [editNode, editBody, editBack, editUrl, editLabel, editColor, editStatus, updateNode, refetchNodes]);

  // ── Create node ─────────────────────────────────────────────────────────────
  const handleCreate = useCallback(() => {
    const nodeType = activeTool === "select" ? "text" : activeTool;
    const canvasNodeType = nodeType;
    createNode.mutate({
      type: nodeType === "text" ? "note" : nodeType,
      canvasNodeType,
      body: newBody || newTitle,
      canvasUrl: newUrl || undefined,
      flashcardBack: newBack || undefined,
      canvasLabel: newTitle || undefined,
      status: newStatus,
      canvasColor: newColor || undefined,
      cardColor: newColor || undefined,
      canvasX: Math.round(createPos.x),
      canvasY: Math.round(createPos.y),
      canvasWidth: nodeType === "group" ? 320 : 220,
      canvasHeight: nodeType === "group" ? 240 : 0,
    }, {
      onSuccess: () => {
        refetchNodes();
        setShowCreate(false);
        setActiveTool("select");
        toast.success("Card created!");
      },
    });
  }, [activeTool, newBody, newTitle, newUrl, newBack, newStatus, newColor, createPos, createNode, refetchNodes]);

  // ── Delete selected ─────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    deleteNode.mutate({ id: selectedId }, {
      onSuccess: () => { refetchNodes(); setSelectedId(null); toast.success("Deleted"); },
    });
  }, [selectedId, deleteNode, refetchNodes]);

  // ── Export .canvas ──────────────────────────────────────────────────────────
  const exportCanvas = useCallback(() => {
    const canvasData = {
      nodes: nodes.map(n => ({
        id: String(n.id),
        type: n.canvasNodeType ?? "text",
        x: n.canvasX,
        y: n.canvasY,
        width: n.canvasWidth,
        height: n.canvasHeight || 120,
        color: n.canvasColor ?? undefined,
        text: n.body ?? undefined,
        file: n.attachmentUrl ?? undefined,
        url: n.canvasUrl ?? undefined,
        label: n.canvasLabel ?? undefined,
      })),
      edges: edges.map(e => ({
        id: String(e.id),
        fromNode: String(e.fromNodeId),
        toNode: String(e.toNodeId),
        fromSide: e.fromSide ?? "right",
        toSide: e.toSide ?? "left",
        fromEnd: e.fromEnd ?? "none",
        toEnd: e.toEnd ?? "arrow",
        color: e.edgeColor ?? undefined,
        label: e.label ?? undefined,
      })),
    };
    const blob = new Blob([JSON.stringify(canvasData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zencanvas.canvas";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as .canvas file");
  }, [nodes, edges]);

  // ── Import .canvas ──────────────────────────────────────────────────────────
  const importCanvas = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        let created = 0;
        for (const n of data.nodes ?? []) {
          await createNode.mutateAsync({
            type: n.type === "text" ? "note" : (n.type ?? "note"),
            canvasNodeType: n.type ?? "text",
            body: n.text ?? n.label ?? "",
            canvasUrl: n.url ?? undefined,
            canvasLabel: n.label ?? undefined,
            canvasColor: n.color ?? undefined,
            canvasX: n.x ?? 0,
            canvasY: n.y ?? 0,
            canvasWidth: n.width ?? 220,
            canvasHeight: n.height ?? 0,
          });
          created++;
        }
        await refetchNodes();
        toast.success(`Imported ${created} cards from .canvas file`);
      } catch {
        toast.error("Failed to parse .canvas file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [createNode, refetchNodes]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const sortedNodes = useMemo(() =>
    [...nodes].sort((a, b) => (a.canvasZIndex ?? 0) - (b.canvasZIndex ?? 0)),
    [nodes]
  );

  // Groups first (render below other cards)
  const groupNodes = sortedNodes.filter(n => (n.canvasNodeType ?? n.type) === "group");
  const otherNodes = sortedNodes.filter(n => (n.canvasNodeType ?? n.type) !== "group");

  const TOOLBAR_ITEMS = [
    { id: "select", label: "✋", title: "Select" },
    { id: "text", label: "📝", title: "Note" },
    { id: "task", label: "✅", title: "Task" },
    { id: "link", label: "🔗", title: "Link" },
    { id: "flashcard", label: "🃏", title: "Flashcard" },
    { id: "file", label: "📎", title: "File" },
    { id: "group", label: "⬜", title: "Group" },
  ] as const;

  const FILTER_TYPES = ["text", "task", "link", "group", "flashcard", "file", "note"];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#f8fafc", userSelect: "none" }} data-canvas-root>
      {/* Dot-grid background */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
        <defs>
          <pattern
            id="dot-grid"
            x={transform.x % (20 * transform.scale)}
            y={transform.y % (20 * transform.scale)}
            width={20 * transform.scale}
            height={20 * transform.scale}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={1} cy={1} r={1} fill="#cbd5e1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {/* Canvas interaction layer */}
      <div
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
      >
        {/* SVG edges */}
        <svg
          ref={svgRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}
        >
          {edges.map(edge => {
            const from = nodeMap.get(edge.fromNodeId);
            const to = nodeMap.get(edge.toNodeId);
            if (!from || !to) return null;
            // Transform node positions to screen
            const fromScreen: CanvasNode = {
              ...from,
              canvasX: from.canvasX * transform.scale + transform.x,
              canvasY: from.canvasY * transform.scale + transform.y,
              canvasWidth: from.canvasWidth * transform.scale,
              canvasHeight: (from.canvasHeight || 120) * transform.scale,
            };
            const toScreen2: CanvasNode = {
              ...to,
              canvasX: to.canvasX * transform.scale + transform.x,
              canvasY: to.canvasY * transform.scale + transform.y,
              canvasWidth: to.canvasWidth * transform.scale,
              canvasHeight: (to.canvasHeight || 120) * transform.scale,
            };
            return <EdgePath key={edge.id} edge={edge} fromNode={fromScreen} toNode={toScreen2} />;
          })}
          {/* Live connection line */}
          {connectLine && (
            <line
              x1={connectLine.x1} y1={connectLine.y1}
              x2={connectLine.x2} y2={connectLine.y2}
              stroke="#6366f1" strokeWidth={2} strokeDasharray="6 3"
              markerEnd="url(#arrow-live)"
            />
          )}
          {connectLine && (
            <defs>
              <marker id="arrow-live" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
              </marker>
            </defs>
          )}
        </svg>

        {/* Render group nodes first (below) */}
        {[...groupNodes, ...otherNodes].map(node => {
          const sx = node.canvasX * transform.scale + transform.x;
          const sy = node.canvasY * transform.scale + transform.y;
          const sw = node.canvasWidth * transform.scale;
          const sh = (node.canvasHeight || 120) * transform.scale;
          const isSelected = selectedId === node.id;
          const nodeType = node.canvasNodeType ?? node.type;

          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: 0, top: 0,
                transform: `translate(${sx}px, ${sy}px)`,
                width: sw,
                height: sh,
                zIndex: (node.canvasZIndex ?? 0) + (nodeType === "group" ? 0 : 10),
                boxShadow: isSelected ? "0 0 0 2px #6366f1, 0 4px 16px rgba(99,102,241,0.2)" : "0 2px 8px rgba(0,0,0,0.08)",
                borderRadius: 10,
                overflow: nodeType === "group" ? "visible" : "hidden",
                cursor: activeTool === "select" ? "grab" : "crosshair",
                willChange: "transform",
              }}
              onPointerDown={e => onCardPointerDown(e, node.id)}
              onPointerMove={onCardPointerMove}
              onPointerUp={e => {
                onCardPointerUp(e, node.id);
                onCardPointerUpConnect(e, node.id);
              }}
              onPointerEnter={() => onCardPointerEnter(node.id)}
            >
              {/* Card content */}
              {nodeType === "group" && <GroupCard node={node} onTap={() => openEdit(node)} />}
              {(nodeType === "text" || nodeType === "note") && <TextCard node={node} onTap={() => openEdit(node)} />}
              {nodeType === "task" && <TaskCard node={node} onTap={() => openEdit(node)} />}
              {(nodeType === "file" || nodeType === "image" || nodeType === "document") && <FileCard node={node} onTap={() => openEdit(node)} />}
              {nodeType === "link" && <LinkCard node={node} onTap={() => openEdit(node)} />}
              {nodeType === "flashcard" && <FlashCard node={node} onTap={() => {}} />}

              {/* Connect handle (right side) */}
              {activeTool === "select" && nodeType !== "group" && (
                <span
                  className="connect-handle"
                  style={{
                    position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)",
                    width: 16, height: 16, borderRadius: "50%",
                    background: "#6366f1", border: "2px solid #fff",
                    cursor: "crosshair", zIndex: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  onPointerDown={e => onConnectHandleDown(e, node.id)}
                />
              )}

              {/* Navigate to detail */}
              {isSelected && nodeType !== "group" && (
                <button
                  style={{
                    position: "absolute", top: -10, right: 20,
                    background: "#6366f1", color: "#fff",
                    border: "none", borderRadius: 6,
                    fontSize: 10, padding: "2px 6px", cursor: "pointer", zIndex: 30,
                  }}
                  onPointerUp={e => { e.stopPropagation(); setLocation(`/node/${node.id}`); }}
                >
                  Open
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Left toolbar */}
      <div
        className="toolbar"
        style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: 6,
          background: "#fff", borderRadius: 14, padding: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          zIndex: 100,
        }}
      >
        {TOOLBAR_ITEMS.map(item => (
          <button
            key={item.id}
            title={item.title}
            style={{
              width: 44, height: 44, borderRadius: 10, border: "none",
              background: activeTool === item.id ? "#6366f1" : "transparent",
              fontSize: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onClick={() => setActiveTool(item.id as typeof activeTool)}
          >
            {item.label}
          </button>
        ))}
        <div style={{ height: 1, background: "#e2e8f0", margin: "2px 0" }} />
        {/* Delete */}
        <button
          title="Delete selected"
          disabled={!selectedId}
          style={{
            width: 44, height: 44, borderRadius: 10, border: "none",
            background: selectedId ? "#fee2e2" : "transparent",
            fontSize: 20, cursor: selectedId ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: selectedId ? 1 : 0.4,
          }}
          onClick={handleDelete}
        >
          🗑️
        </button>
      </div>

      {/* Top bar: filter + zoom + import/export */}
      <div
        className="toolbar"
        style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 6,
          background: "#fff", borderRadius: 12, padding: "6px 10px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          zIndex: 100, maxWidth: "90vw", overflowX: "auto",
        }}
      >
        <button
          style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, border: "1px solid #e2e8f0", background: !filterType ? "#6366f1" : "#fff", color: !filterType ? "#fff" : "#374151", cursor: "pointer" }}
          onClick={() => setFilterType(null)}
        >All</button>
        {FILTER_TYPES.map(t => (
          <button
            key={t}
            style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, border: "1px solid #e2e8f0", background: filterType === t ? "#6366f1" : "#fff", color: filterType === t ? "#fff" : "#374151", cursor: "pointer", whiteSpace: "nowrap" }}
            onClick={() => setFilterType(filterType === t ? null : t)}
          >
            {t}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
        <button style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }} onClick={() => setTransform(t => ({ ...t, scale: clamp(t.scale * 1.2, 0.1, 5) }))}>+</button>
        <span style={{ fontSize: 11, minWidth: 36, textAlign: "center" }}>{Math.round(transform.scale * 100)}%</span>
        <button style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }} onClick={() => setTransform(t => ({ ...t, scale: clamp(t.scale * 0.8, 0.1, 5) }))}>−</button>
        <button style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }} onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}>⟳</button>
        <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
        <button style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }} onClick={exportCanvas} title="Export .canvas">⬇️</button>
        <button style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()} title="Import .canvas">⬆️</button>
        <input ref={fileInputRef} type="file" accept=".canvas,.json" style={{ display: "none" }} onChange={importCanvas} />
      </div>

      {/* Edit sheet */}
      {editNode && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 200,
          background: "#fff", borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.15)",
          padding: "20px 20px 32px",
          maxHeight: "60vh", overflowY: "auto",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Edit Card</span>
            <button onClick={() => setEditNode(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>

          {(editNode.canvasNodeType === "link") && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>URL</label>
              <input value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
          )}

          {(editNode.canvasNodeType === "group") && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Group Label</label>
              <input value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder="Group name…" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>
              {editNode.canvasNodeType === "flashcard" ? "Question (front)" : "Content"}
            </label>
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={4}
              dir={isRTL(editBody) ? "rtl" : "ltr"}
              placeholder="Write here…"
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          {editNode.canvasNodeType === "flashcard" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Answer (back)</label>
              <textarea
                value={editBack}
                onChange={e => setEditBack(e.target.value)}
                rows={3}
                dir={isRTL(editBack) ? "rtl" : "ltr"}
                placeholder="Answer…"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
          )}

          {editNode.type === "task" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Status</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}>
                {["inbox", "next", "in_progress", "done", "blocked", "someday"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 }}>Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["", "1", "2", "3", "4", "5", "6"].map(c => (
                <button
                  key={c || "none"}
                  onClick={() => setEditColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: c ? resolveColor(c) : "#f1f5f9",
                    border: editColor === c ? "3px solid #6366f1" : "2px solid #e2e8f0",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={saveEdit}
              style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Save
            </button>
            <button
              onClick={() => { deleteNode.mutate({ id: editNode.id }, { onSuccess: () => { refetchNodes(); setEditNode(null); setSelectedId(null); } }); }}
              style={{ padding: "12px 16px", borderRadius: 10, border: "none", background: "#fee2e2", color: "#ef4444", fontSize: 15, cursor: "pointer" }}
            >
              🗑️
            </button>
          </div>
        </div>
      )}

      {/* Create sheet */}
      {showCreate && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 200,
          background: "#fff", borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.15)",
          padding: "20px 20px 32px",
          maxHeight: "60vh", overflowY: "auto",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              New {activeTool === "select" ? "Note" : activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
            </span>
            <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>

          {activeTool === "group" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Group Label</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Group name…" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
          )}

          {activeTool === "link" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>URL</label>
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://…" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
          )}

          {activeTool !== "group" && activeTool !== "link" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>
                {activeTool === "flashcard" ? "Question (front)" : "Content"}
              </label>
              <textarea
                value={newBody}
                onChange={e => setNewBody(e.target.value)}
                rows={4}
                dir={isRTL(newBody) ? "rtl" : "ltr"}
                placeholder="Write here…"
                autoFocus
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
          )}

          {activeTool === "flashcard" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Answer (back)</label>
              <textarea
                value={newBack}
                onChange={e => setNewBack(e.target.value)}
                rows={3}
                dir={isRTL(newBack) ? "rtl" : "ltr"}
                placeholder="Answer…"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
          )}

          {activeTool === "task" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}>
                {["inbox", "next", "in_progress", "done", "blocked", "someday"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 }}>Color (preset)</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["", "1", "2", "3", "4", "5", "6"].map(c => (
                <button
                  key={c || "none"}
                  onClick={() => setNewColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: c ? resolveColor(c) : "#f1f5f9",
                    border: newColor === c ? "3px solid #6366f1" : "2px solid #e2e8f0",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Create Card
          </button>
        </div>
      )}

      {/* Empty state */}
      {nodes.length === 0 && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          textAlign: "center", pointerEvents: "none", zIndex: 50,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Your canvas is empty</div>
          <div style={{ fontSize: 14, color: "#9ca3af" }}>Pick a tool from the left toolbar and tap to create a card</div>
        </div>
      )}
    </div>
  );
}
