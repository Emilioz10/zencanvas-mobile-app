/**
 * TouchCanvas — Mobile-first infinite canvas for ZenCanvas PWA
 *
 * Features:
 * - Pinch-to-zoom + two-finger pan (touch-native)
 * - Draggable cards (sticky note, task, image, document)
 * - SVG bezier connection arrows between cards
 * - Bottom mobile toolbar (large touch targets)
 * - Tap card to edit inline
 * - Long-press card edge to draw a connection
 * - Dot-grid background
 */

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CanvasCard {
  id: number;
  type: string;
  body: string | null;
  tags: string | null;
  status: string | null;
  canvasX: number;
  canvasY: number;
  canvasWidth: number;
  canvasHeight: number;
  cardColor: string | null;
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
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_COLORS: Record<string, string> = {
  note: "#fef9c3",
  task: "#dbeafe",
  project: "#ede9fe",
  person: "#fce7f3",
  event: "#dcfce7",
  idea: "#ffedd5",
  image: "#f0fdf4",
  document: "#f8fafc",
};

const STATUS_COLORS: Record<string, string> = {
  done: "#22c55e",
  in_progress: "#3b82f6",
  blocked: "#ef4444",
  inbox: "#94a3b8",
  next: "#f59e0b",
  someday: "#a78bfa",
};

const PRIORITY_EMOJI: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
};

const MIN_SCALE = 0.15;
const MAX_SCALE = 3;
const DEFAULT_CARD_W = 220;
const DEFAULT_CARD_H = 140;

// ─── Utility ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getCardTitle(card: CanvasCard): string {
  if (!card.body) return `(${card.type})`;
  const firstLine = card.body.split("\n")[0].replace(/^#+\s*/, "").trim();
  return firstLine.slice(0, 60) || `(${card.type})`;
}

function getCardBody(card: CanvasCard): string {
  if (!card.body) return "";
  const lines = card.body.split("\n");
  return lines.slice(1).join("\n").trim().slice(0, 120);
}

function isRTL(text: string): boolean {
  return /[\u0590-\u05FF\u0600-\u06FF]/.test(text);
}

// ─── SVG Arrows ───────────────────────────────────────────────────────────────

function EdgeArrow({
  from,
  to,
  label,
  type,
  selected,
  onClick,
}: {
  from: { x: number; y: number; w: number; h: number };
  to: { x: number; y: number; w: number; h: number };
  label: string | null;
  type: string;
  selected: boolean;
  onClick: () => void;
}) {
  const x1 = from.x + from.w;
  const y1 = from.y + from.h / 2;
  const x2 = to.x;
  const y2 = to.y + to.h / 2;
  const cx1 = x1 + Math.abs(x2 - x1) * 0.5;
  const cy1 = y1;
  const cx2 = x2 - Math.abs(x2 - x1) * 0.5;
  const cy2 = y2;
  const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  const isBlocking = type === "blocked_by" || type === "blocks";
  const color = isBlocking ? "#ef4444" : selected ? "#6366f1" : "#94a3b8";
  const strokeDash = isBlocking ? "6 3" : "none";
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Hit area */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={16} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 2.5 : 1.5}
        strokeDasharray={strokeDash}
        markerEnd={`url(#arrow-${isBlocking ? "red" : selected ? "indigo" : "gray"})`}
      />
      {label && (
        <text
          x={midX}
          y={midY - 6}
          textAnchor="middle"
          fontSize={11}
          fill={color}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

// ─── Card Component ───────────────────────────────────────────────────────────

function CanvasCardView({
  card,
  selected,
  onPointerDown,
  onTap,
  onConnectStart,
}: {
  card: CanvasCard;
  selected: boolean;
  onPointerDown: (e: ReactPointerEvent) => void;
  onTap: () => void;
  onConnectStart: (e: ReactPointerEvent) => void;
}) {
  const title = getCardTitle(card);
  const body = getCardBody(card);
  const rtl = isRTL(title);
  const bg = card.cardColor || CARD_COLORS[card.type] || "#ffffff";
  const w = card.canvasWidth || DEFAULT_CARD_W;
  const statusColor = STATUS_COLORS[card.status || "inbox"] || "#94a3b8";

  const isImage = card.type === "image" || card.attachmentType === "image";
  const isDoc =
    card.attachmentType === "pdf" ||
    card.attachmentType === "doc" ||
    card.attachmentType === "document";

  return (
    <div
      style={{
        position: "absolute",
        left: card.canvasX,
        top: card.canvasY,
        width: w,
        minHeight: card.canvasHeight || DEFAULT_CARD_H,
        background: bg,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 2px #6366f1, 0 4px 24px rgba(99,102,241,0.2)"
          : "0 2px 8px rgba(0,0,0,0.10)",
        border: selected ? "2px solid #6366f1" : "1.5px solid rgba(0,0,0,0.07)",
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
        transition: "box-shadow 0.15s",
        display: "flex",
        flexDirection: "column",
      }}
      onPointerDown={onPointerDown}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 10px 4px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          background: "rgba(0,0,0,0.03)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: statusColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {card.type}
        </span>
        <span style={{ flex: 1 }} />
        {/* Connect handle */}
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#6366f1",
            cursor: "crosshair",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onConnectStart(e);
          }}
          title="גרור לחיבור"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <circle cx="5" cy="5" r="3" fill="white" />
          </svg>
        </div>
      </div>

      {/* Image attachment */}
      {isImage && card.attachmentUrl && (
        <img
          src={card.attachmentUrl}
          alt={card.attachmentName || "image"}
          style={{
            width: "100%",
            maxHeight: 140,
            objectFit: "cover",
            display: "block",
          }}
          draggable={false}
        />
      )}

      {/* Document attachment */}
      {isDoc && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            background: "rgba(0,0,0,0.04)",
          }}
        >
          <span style={{ fontSize: 24 }}>📄</span>
          <span style={{ fontSize: 12, color: "#475569", wordBreak: "break-all" }}>
            {card.attachmentName || "מסמך"}
          </span>
        </div>
      )}

      {/* Body */}
      <div
        style={{
          padding: "8px 10px 10px",
          flex: 1,
          direction: rtl ? "rtl" : "ltr",
          textAlign: rtl ? "right" : "left",
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          onTap();
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1e293b",
            lineHeight: 1.4,
            marginBottom: body ? 4 : 0,
            wordBreak: "break-word",
          }}
        >
          {title}
        </div>
        {body && (
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              lineHeight: 1.5,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {body}
          </div>
        )}
        {card.tags && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {card.tags
              .split(",")
              .filter(Boolean)
              .map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    background: "rgba(99,102,241,0.12)",
                    color: "#6366f1",
                    borderRadius: 4,
                    padding: "1px 5px",
                  }}
                >
                  {tag.trim()}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Canvas ──────────────────────────────────────────────────────────────

export default function TouchCanvas() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Transform state
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });

  // Cards and edges from server
  const { data: nodesData, refetch: refetchNodes } = trpc.nodes.list.useQuery(
    {},
    { enabled: !!user }
  );
  const { data: edgesData, refetch: refetchEdges } = trpc.relationships.all.useQuery(
    undefined,
    { enabled: !!user }
  );

  const updateNode = trpc.nodes.update.useMutation();
  const createNode = trpc.nodes.create.useMutation();
  const deleteNode = trpc.nodes.delete.useMutation();
  const createRel = trpc.relationships.create.useMutation();
  const deleteRel = trpc.relationships.delete.useMutation();

  // Local overlay state for dragging
  const [localPositions, setLocalPositions] = useState<Record<number, { x: number; y: number }>>({});
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<number | null>(null);

  // Connecting state
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null);
  const [connectingPos, setConnectingPos] = useState<{ x: number; y: number } | null>(null);

  // Tool: "select" | "note" | "task" | "image" | "document"
  const [tool, setTool] = useState<string>("select");

  // Filter
  const [filterType, setFilterType] = useState<string | null>(null);

  // Create dialog
  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    type: string;
    x: number;
    y: number;
  } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newStatus, setNewStatus] = useState("inbox");

  // Edit dialog
  const [editCard, setEditCard] = useState<CanvasCard | null>(null);
  const [editBody, setEditBody] = useState("");

  // Refs for gesture tracking
  const canvasRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Pointer tracking for pan/zoom
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchMid = useRef<{ x: number; y: number } | null>(null);

  // Card drag tracking
  const draggingCard = useRef<{
    id: number;
    startPointerX: number;
    startPointerY: number;
    startCardX: number;
    startCardY: number;
  } | null>(null);

  // Combine server data with local position overrides
  const cards: CanvasCard[] = useMemo(() => {
    if (!nodesData) return [];
    return nodesData
      .filter((n) => !filterType || n.type === filterType)
      .map((n) => ({
        ...n,
        canvasX: localPositions[n.id]?.x ?? n.canvasX ?? 0,
        canvasY: localPositions[n.id]?.y ?? n.canvasY ?? 0,
        canvasWidth: n.canvasWidth ?? DEFAULT_CARD_W,
        canvasHeight: n.canvasHeight ?? DEFAULT_CARD_H,
        cardColor: n.cardColor ?? null,
        attachmentUrl: n.attachmentUrl ?? null,
        attachmentType: n.attachmentType ?? null,
        attachmentName: n.attachmentName ?? null,
        language: n.language ?? "en",
      }));
  }, [nodesData, localPositions, filterType]);

  const edges: CanvasEdge[] = useMemo(() => edgesData ?? [], [edgesData]);

  // Card lookup map
  const cardMap = useMemo(() => {
    const m = new Map<number, CanvasCard>();
    cards.forEach((c) => m.set(c.id, c));
    return m;
  }, [cards]);

  // ── Pointer events for canvas pan/zoom ──────────────────────────────────────

  const onCanvasPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("[data-card]")) return;
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

      // Tap on canvas to create card
      if (tool !== "select" && activePointers.current.size === 1) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const t = transformRef.current;
        const cx = (e.clientX - rect.left - t.x) / t.scale;
        const cy = (e.clientY - rect.top - t.y) / t.scale;
        setCreateDialog({ open: true, type: tool, x: cx, y: cy });
        setNewTitle("");
        setNewBody("");
        setNewStatus("inbox");
        setTool("select");
      }
    },
    [tool]
  );

  const onCanvasPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(e.pointerId)) return;
    const prev = activePointers.current.get(e.pointerId)!;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pointers = Array.from(activePointers.current.values());

    if (pointers.length === 2) {
      // Pinch-zoom
      const [p1, p2] = pointers;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      if (lastPinchDist.current !== null && lastPinchMid.current !== null) {
        const scaleDelta = dist / lastPinchDist.current;
        const rect = canvasRef.current!.getBoundingClientRect();
        const ox = mid.x - rect.left;
        const oy = mid.y - rect.top;

        setTransform((t) => {
          const newScale = clamp(t.scale * scaleDelta, MIN_SCALE, MAX_SCALE);
          const scaleRatio = newScale / t.scale;
          const panDx = mid.x - lastPinchMid.current!.x;
          const panDy = mid.y - lastPinchMid.current!.y;
          return {
            scale: newScale,
            x: ox - (ox - t.x) * scaleRatio + panDx,
            y: oy - (oy - t.y) * scaleRatio + panDy,
          };
        });
      }
      lastPinchDist.current = dist;
      lastPinchMid.current = mid;
    } else if (pointers.length === 1 && !draggingCard.current) {
      // Pan
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
    }

    // Update connecting line
    if (connectingFrom !== null) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const t = transformRef.current;
      setConnectingPos({
        x: (e.clientX - rect.left - t.x) / t.scale,
        y: (e.clientY - rect.top - t.y) / t.scale,
      });
    }
  }, [connectingFrom]);

  const onCanvasPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size < 2) {
        lastPinchDist.current = null;
        lastPinchMid.current = null;
      }
      // Cancel connecting if released on canvas
      if (connectingFrom !== null) {
        setConnectingFrom(null);
        setConnectingPos(null);
      }
    },
    [connectingFrom]
  );

  // ── Card drag ───────────────────────────────────────────────────────────────

  const onCardPointerDown = useCallback(
    (e: ReactPointerEvent, card: CanvasCard) => {
      e.stopPropagation();
      if (tool !== "select") return;
      setSelectedCardId(card.id);
      setSelectedEdgeId(null);
      draggingCard.current = {
        id: card.id,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startCardX: card.canvasX,
        startCardY: card.canvasY,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [tool]
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingCard.current) return;
      const t = transformRef.current;
      const dx = (e.clientX - draggingCard.current.startPointerX) / t.scale;
      const dy = (e.clientY - draggingCard.current.startPointerY) / t.scale;
      const newX = draggingCard.current.startCardX + dx;
      const newY = draggingCard.current.startCardY + dy;
      setLocalPositions((prev) => ({
        ...prev,
        [draggingCard.current!.id]: { x: newX, y: newY },
      }));
    };

    const onUp = (e: PointerEvent) => {
      if (!draggingCard.current) return;
      const id = draggingCard.current.id;
      const pos = localPositions[id];
      if (pos) {
        updateNode.mutate(
          { id, canvasX: Math.round(pos.x), canvasY: Math.round(pos.y) },
          { onError: () => toast.error("שגיאה בשמירת מיקום") }
        );
      }
      draggingCard.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [localPositions, updateNode]);

  // ── Connect handle ──────────────────────────────────────────────────────────

  const onConnectStart = useCallback((e: ReactPointerEvent, cardId: number) => {
    e.stopPropagation();
    setConnectingFrom(cardId);
    const rect = canvasRef.current!.getBoundingClientRect();
    const t = transformRef.current;
    setConnectingPos({
      x: (e.clientX - rect.left - t.x) / t.scale,
      y: (e.clientY - rect.top - t.y) / t.scale,
    });
  }, []);

  const onCardConnectDrop = useCallback(
    (toCardId: number) => {
      if (connectingFrom === null || connectingFrom === toCardId) {
        setConnectingFrom(null);
        setConnectingPos(null);
        return;
      }
      createRel.mutate(
        { fromNodeId: connectingFrom, toNodeId: toCardId, type: "related_to" },
        {
          onSuccess: () => {
            refetchEdges();
            toast.success("חיבור נוצר");
          },
          onError: () => toast.error("שגיאה ביצירת חיבור"),
        }
      );
      setConnectingFrom(null);
      setConnectingPos(null);
    },
    [connectingFrom, createRel, refetchEdges]
  );

  // ── Create card ─────────────────────────────────────────────────────────────

  const handleCreateCard = useCallback(() => {
    if (!createDialog) return;
    const title = newTitle.trim();
    if (!title) {
      toast.error("יש להזין כותרת");
      return;
    }
    createNode.mutate(
      {
        type: createDialog.type === "note" ? "note" : createDialog.type === "task" ? "task" : createDialog.type,
        body: title + (newBody ? "\n" + newBody : ""),
        status: newStatus,
        canvasX: Math.round(createDialog.x),
        canvasY: Math.round(createDialog.y),
        canvasWidth: DEFAULT_CARD_W,
      },
      {
        onSuccess: () => {
          refetchNodes();
          setCreateDialog(null);
          toast.success("כרטיסייה נוצרה");
        },
        onError: () => toast.error("שגיאה ביצירת כרטיסייה"),
      }
    );
  }, [createDialog, newTitle, newBody, newStatus, createNode, refetchNodes]);

  // ── Edit card ───────────────────────────────────────────────────────────────

  const handleSaveEdit = useCallback(() => {
    if (!editCard) return;
    updateNode.mutate(
      { id: editCard.id, body: editBody },
      {
        onSuccess: () => {
          refetchNodes();
          setEditCard(null);
          toast.success("נשמר");
        },
        onError: () => toast.error("שגיאה בשמירה"),
      }
    );
  }, [editCard, editBody, updateNode, refetchNodes]);

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDeleteSelected = useCallback(() => {
    if (selectedEdgeId !== null) {
      deleteRel.mutate(
        { id: selectedEdgeId },
        {
          onSuccess: () => {
            refetchEdges();
            setSelectedEdgeId(null);
            toast.success("חיבור נמחק");
          },
        }
      );
    } else if (selectedCardId !== null) {
      deleteNode.mutate(
        { id: selectedCardId },
        {
          onSuccess: () => {
            refetchNodes();
            setSelectedCardId(null);
            toast.success("כרטיסייה נמחקה");
          },
        }
      );
    }
  }, [selectedEdgeId, selectedCardId, deleteRel, deleteNode, refetchEdges, refetchNodes]);

  // ── File upload ─────────────────────────────────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadPos, setPendingUploadPos] = useState<{ x: number; y: number } | null>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      const pos = pendingUploadPos || { x: 100, y: 100 };
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!data.url) throw new Error("No URL");
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";
        createNode.mutate(
          {
            type: isImage ? "image" : "document",
            body: file.name,
            canvasX: Math.round(pos.x),
            canvasY: Math.round(pos.y),
            canvasWidth: isImage ? 260 : DEFAULT_CARD_W,
            attachmentUrl: data.url,
            attachmentType: isImage ? "image" : isPdf ? "pdf" : "doc",
            attachmentName: file.name,
          },
          {
            onSuccess: () => {
              refetchNodes();
              toast.success("קובץ הועלה");
            },
            onError: () => toast.error("שגיאה בהעלאת קובץ"),
          }
        );
      } catch {
        toast.error("שגיאה בהעלאת קובץ");
      }
    },
    [pendingUploadPos, createNode, refetchNodes]
  );

  // ── Zoom controls ───────────────────────────────────────────────────────────

  const zoom = useCallback((delta: number) => {
    setTransform((t) => ({
      ...t,
      scale: clamp(t.scale * (1 + delta), MIN_SCALE, MAX_SCALE),
    }));
  }, []);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  const nodeTypes = useMemo(() => {
    if (!nodesData) return [];
    const types = new Set(nodesData.map((n) => n.type));
    return Array.from(types);
  }, [nodesData]);

  const dotSize = 1.5;
  const dotSpacing = 28;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#f8fafc",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top filter bar ── */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 6,
          zIndex: 30,
          background: "rgba(255,255,255,0.92)",
          borderRadius: 20,
          padding: "4px 8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          backdropFilter: "blur(8px)",
          overflowX: "auto",
          maxWidth: "calc(100vw - 120px)",
        }}
      >
        <button
          onClick={() => setFilterType(null)}
          style={{
            padding: "4px 12px",
            borderRadius: 14,
            border: "none",
            background: filterType === null ? "#6366f1" : "transparent",
            color: filterType === null ? "white" : "#64748b",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          הכל
        </button>
        {nodeTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(filterType === t ? null : t)}
            style={{
              padding: "4px 12px",
              borderRadius: 14,
              border: "none",
              background: filterType === t ? "#6366f1" : "transparent",
              color: filterType === t ? "white" : "#64748b",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Canvas area ── */}
      <div
        ref={canvasRef}
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          touchAction: "none",
        }}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerCancel={onCanvasPointerUp}
      >
        {/* Dot grid background */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <defs>
            <pattern
              id="dot-grid"
              x={transform.x % (dotSpacing * transform.scale)}
              y={transform.y % (dotSpacing * transform.scale)}
              width={dotSpacing * transform.scale}
              height={dotSpacing * transform.scale}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={dotSpacing * transform.scale * 0.5}
                cy={dotSpacing * transform.scale * 0.5}
                r={dotSize * Math.min(transform.scale, 1)}
                fill="#cbd5e1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Transformed layer */}
        <div
          style={{
            position: "absolute",
            transformOrigin: "0 0",
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            willChange: "transform",
          }}
        >
          {/* SVG edges */}
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 9999,
              height: 9999,
              overflow: "visible",
              pointerEvents: "none",
            }}
          >
            <defs>
              {["gray", "indigo", "red"].map((color) => (
                <marker
                  key={color}
                  id={`arrow-${color}`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path
                    d="M0,0 L0,6 L8,3 z"
                    fill={
                      color === "gray"
                        ? "#94a3b8"
                        : color === "indigo"
                        ? "#6366f1"
                        : "#ef4444"
                    }
                  />
                </marker>
              ))}
            </defs>
            {/* Existing edges */}
            {edges.map((edge) => {
              const from = cardMap.get(edge.fromNodeId);
              const to = cardMap.get(edge.toNodeId);
              if (!from || !to) return null;
              return (
                <EdgeArrow
                  key={edge.id}
                  from={{
                    x: from.canvasX,
                    y: from.canvasY,
                    w: from.canvasWidth || DEFAULT_CARD_W,
                    h: from.canvasHeight || DEFAULT_CARD_H,
                  }}
                  to={{
                    x: to.canvasX,
                    y: to.canvasY,
                    w: to.canvasWidth || DEFAULT_CARD_W,
                    h: to.canvasHeight || DEFAULT_CARD_H,
                  }}
                  label={edge.label}
                  type={edge.type}
                  selected={selectedEdgeId === edge.id}
                  onClick={() => {
                    setSelectedEdgeId(edge.id);
                    setSelectedCardId(null);
                  }}
                />
              );
            })}

            {/* Live connecting line */}
            {connectingFrom !== null && connectingPos !== null && (() => {
              const from = cardMap.get(connectingFrom);
              if (!from) return null;
              const x1 = from.canvasX + (from.canvasWidth || DEFAULT_CARD_W);
              const y1 = from.canvasY + (from.canvasHeight || DEFAULT_CARD_H) / 2;
              const x2 = connectingPos.x;
              const y2 = connectingPos.y;
              return (
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  style={{ pointerEvents: "none" }}
                />
              );
            })()}
          </svg>

          {/* Cards */}
          {cards.map((card) => (
            <div
              key={card.id}
              data-card="true"
              onPointerUp={() => {
                if (connectingFrom !== null) {
                  onCardConnectDrop(card.id);
                }
              }}
            >
              <CanvasCardView
                card={card}
                selected={selectedCardId === card.id}
                onPointerDown={(e) => onCardPointerDown(e, card)}
                onTap={() => {
                  setEditCard(card);
                  setEditBody(card.body || "");
                }}
                onConnectStart={(e) => onConnectStart(e, card.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Zoom indicator ── */}
      <div
        style={{
          position: "absolute",
          bottom: 90,
          right: 16,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          zIndex: 20,
        }}
      >
        <button
          onClick={() => zoom(0.2)}
          style={zoomBtnStyle}
          aria-label="הגדל"
        >
          +
        </button>
        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            borderRadius: 8,
            padding: "2px 6px",
            fontSize: 11,
            color: "#64748b",
            textAlign: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          {Math.round(transform.scale * 100)}%
        </div>
        <button
          onClick={() => zoom(-0.2)}
          style={zoomBtnStyle}
          aria-label="הקטן"
        >
          −
        </button>
        <button
          onClick={resetView}
          style={{ ...zoomBtnStyle, fontSize: 10 }}
          aria-label="אפס תצוגה"
        >
          ↺
        </button>
      </div>

      {/* ── Bottom toolbar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 72,
          background: "rgba(255,255,255,0.97)",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 8px",
          zIndex: 30,
          backdropFilter: "blur(12px)",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
        }}
      >
        {[
          { id: "select", icon: "↖", label: "בחר" },
          { id: "note", icon: "📝", label: "פתק" },
          { id: "task", icon: "✅", label: "משימה" },
          {
            id: "upload",
            icon: "📎",
            label: "קובץ",
            action: () => {
              const rect = canvasRef.current!.getBoundingClientRect();
              const t = transformRef.current;
              setPendingUploadPos({
                x: (rect.width / 2 - t.x) / t.scale,
                y: (rect.height / 2 - t.y) / t.scale,
              });
              fileInputRef.current?.click();
            },
          },
          {
            id: "delete",
            icon: "🗑",
            label: "מחק",
            action: handleDeleteSelected,
            disabled: selectedCardId === null && selectedEdgeId === null,
          },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={btn.action || (() => setTool(btn.id))}
            disabled={btn.disabled}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "6px 12px",
              borderRadius: 12,
              border: "none",
              background: tool === btn.id ? "#ede9fe" : "transparent",
              color:
                btn.disabled
                  ? "#cbd5e1"
                  : tool === btn.id
                  ? "#6366f1"
                  : "#475569",
              fontSize: 22,
              cursor: btn.disabled ? "not-allowed" : "pointer",
              minWidth: 52,
              transition: "background 0.15s",
            }}
          >
            <span>{btn.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,.doc,.docx,.txt"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = "";
        }}
      />

      {/* ── Create card dialog ── */}
      {createDialog?.open && (
        <div style={overlayStyle}>
          <div style={dialogStyle}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#1e293b", direction: "rtl" }}>
              {createDialog.type === "note" ? "פתק חדש" : "משימה חדשה"}
            </h3>
            <input
              autoFocus
              placeholder="כותרת..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCard()}
              style={inputStyle}
              dir="auto"
            />
            <textarea
              placeholder="תוכן (אופציונלי)..."
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical", marginTop: 8 }}
              dir="auto"
            />
            {createDialog.type === "task" && (
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ ...inputStyle, marginTop: 8 }}
              >
                <option value="inbox">📥 Inbox</option>
                <option value="next">⚡ Next</option>
                <option value="in_progress">🔄 In Progress</option>
                <option value="someday">💭 Someday</option>
                <option value="done">✅ Done</option>
              </select>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={handleCreateCard} style={primaryBtnStyle}>
                צור
              </button>
              <button onClick={() => setCreateDialog(null)} style={secondaryBtnStyle}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit card dialog ── */}
      {editCard && (
        <div style={overlayStyle}>
          <div style={{ ...dialogStyle, maxHeight: "80vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#1e293b", direction: "rtl" }}>
              עריכה
            </h3>
            <textarea
              autoFocus
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={8}
              style={{ ...inputStyle, resize: "vertical" }}
              dir="auto"
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={handleSaveEdit} style={primaryBtnStyle}>
                שמור
              </button>
              <button
                onClick={() => setLocation(`/node/${editCard.id}`)}
                style={secondaryBtnStyle}
              >
                פתח מלא
              </button>
              <button onClick={() => setEditCard(null)} style={secondaryBtnStyle}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Style helpers ─────────────────────────────────────────────────────────────

const zoomBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: "none",
  background: "rgba(255,255,255,0.9)",
  color: "#475569",
  fontSize: 18,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  zIndex: 100,
  padding: "0 0 0 0",
};

const dialogStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "20px 20px 0 0",
  padding: "20px 20px 32px",
  width: "100%",
  maxWidth: 480,
  boxShadow: "0 -4px 32px rgba(0,0,0,0.15)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1.5px solid #e2e8f0",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "12px",
  borderRadius: 12,
  border: "none",
  background: "#6366f1",
  color: "white",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "12px",
  borderRadius: 12,
  border: "1.5px solid #e2e8f0",
  background: "white",
  color: "#475569",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};
