/**
 * InfiniteCanvas — canvs.io-style infinite canvas with:
 * - Dot-grid background
 * - Sticky note cards (colorful)
 * - Task cards with status, priority, ID
 * - Directed connection arrows with labels (tasks-map style)
 * - Left vertical toolbar
 * - Pan (drag background) + pinch/scroll zoom
 * - Drag to reposition cards
 * - Click card to select / double-click to edit
 * - Draw connection: drag from card handle → another card
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MousePointer2,
  StickyNote,
  Square,
  ArrowRight,
  Plus,
  Minus,
  Maximize2,
  Trash2,
  Link,
  Unlink,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  Filter,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType = "task" | "note" | "project" | "person" | "event" | "idea";
type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
type Priority = "urgent" | "high" | "medium" | "low" | "none";

interface CanvasNode {
  id: number;
  type: NodeType;
  title: string;
  body?: string;
  status?: TaskStatus;
  priority?: Priority;
  tags?: string;
  canvasX: number;
  canvasY: number;
  color?: string;
  width?: number;
  height?: number;
}

interface CanvasEdge {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  type: string;
  label?: string;
}

interface Point {
  x: number;
  y: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_SIZE = 32;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3;
const DEFAULT_CARD_WIDTH = 220;
const DEFAULT_CARD_HEIGHT = 120;
const STICKY_HEIGHT = 140;

const NODE_COLORS: Record<NodeType, string> = {
  task: "#dbeafe",      // blue-100
  note: "#fef9c3",      // yellow-100
  project: "#ede9fe",   // violet-100
  person: "#ffedd5",    // orange-100
  event: "#dcfce7",     // green-100
  idea: "#fce7f3",      // pink-100
};

const NODE_BORDER: Record<NodeType, string> = {
  task: "#93c5fd",
  note: "#fde047",
  project: "#c4b5fd",
  person: "#fdba74",
  event: "#86efac",
  idea: "#f9a8d4",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  done: "#22c55e",
  cancelled: "#ef4444",
};

const PRIORITY_EMOJI: Record<Priority, string> = {
  urgent: "🔺",
  high: "⏫",
  medium: "🔼",
  low: "🔽",
  none: "",
};

const STICKY_COLORS = [
  "#fef9c3", "#dcfce7", "#dbeafe", "#ede9fe",
  "#fce7f3", "#ffedd5", "#f0fdf4", "#fdf4ff",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNodeTitle(node: { type: string; body?: string | null; properties?: string | null }): string {
  if (node.properties) {
    try {
      const p = JSON.parse(node.properties);
      if (p.title) return p.title;
    } catch { /* ignore */ }
  }
  if (node.body) return node.body.split("\n")[0].slice(0, 60);
  return `(${node.type})`;
}

function getNodeColor(node: { type: string; properties?: string | null }): string {
  if (node.properties) {
    try {
      const p = JSON.parse(node.properties);
      if (p.color) return p.color;
    } catch { /* ignore */ }
  }
  return NODE_COLORS[node.type as NodeType] ?? "#f3f4f6";
}

function getPriority(node: { properties?: string | null }): Priority {
  if (node.properties) {
    try {
      const p = JSON.parse(node.properties);
      if (p.priority) return p.priority as Priority;
    } catch { /* ignore */ }
  }
  return "none";
}

// ─── Card Component ───────────────────────────────────────────────────────────

interface CardProps {
  node: CanvasNode;
  selected: boolean;
  connecting: boolean; // currently drawing a connection FROM this card
  onMouseDown: (e: React.MouseEvent, nodeId: number) => void;
  onConnectStart: (e: React.MouseEvent, nodeId: number) => void;
  onClick: (nodeId: number) => void;
  onDoubleClick: (nodeId: number) => void;
  zoom: number;
}

const NodeCard = React.memo(function NodeCard({
  node,
  selected,
  connecting,
  onMouseDown,
  onConnectStart,
  onClick,
  onDoubleClick,
  zoom,
}: CardProps) {
  const isTask = node.type === "task";
  const isNote = node.type === "note";
  const bgColor = node.color ?? NODE_COLORS[node.type] ?? "#f3f4f6";
  const borderColor = selected
    ? "#6366f1"
    : connecting
    ? "#f59e0b"
    : NODE_BORDER[node.type] ?? "#e5e7eb";

  const statusColor = node.status ? STATUS_COLORS[node.status] : undefined;
  const priorityEmoji = node.priority ? PRIORITY_EMOJI[node.priority] : "";

  const cardStyle: React.CSSProperties = {
    position: "absolute",
    left: node.canvasX,
    top: node.canvasY,
    width: node.width ?? DEFAULT_CARD_WIDTH,
    minHeight: isNote ? STICKY_HEIGHT : DEFAULT_CARD_HEIGHT,
    backgroundColor: bgColor,
    border: `2px solid ${borderColor}`,
    borderRadius: isNote ? "2px 12px 12px 12px" : "12px",
    boxShadow: selected
      ? "0 0 0 3px rgba(99,102,241,0.3), 0 8px 24px rgba(0,0,0,0.15)"
      : "0 2px 8px rgba(0,0,0,0.1)",
    cursor: "grab",
    userSelect: "none",
    transition: "box-shadow 0.15s ease",
    overflow: "hidden",
  };

  return (
    <div
      style={cardStyle}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={() => onClick(node.id)}
      onDoubleClick={() => onDoubleClick(node.id)}
      className="group"
    >
      {/* Sticky note fold corner */}
      {isNote && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 20,
            height: 20,
            background: `linear-gradient(225deg, rgba(0,0,0,0.12) 50%, transparent 50%)`,
            borderRadius: "0 10px 0 0",
          }}
        />
      )}

      {/* Header bar */}
      <div
        style={{
          padding: "8px 10px 6px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderBottom: isNote ? "none" : "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Status dot */}
        {isTask && statusColor && (
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: statusColor,
              flexShrink: 0,
            }}
          />
        )}

        {/* Priority */}
        {priorityEmoji && (
          <span style={{ fontSize: 11, flexShrink: 0 }}>{priorityEmoji}</span>
        )}

        {/* Title */}
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#1e293b",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            direction: /[\u0590-\u05FF]/.test(node.title) ? "rtl" : "ltr",
          }}
        >
          {node.title}
        </span>
      </div>

      {/* Body */}
      {node.body && node.body !== node.title && (
        <div
          style={{
            padding: "6px 10px",
            fontSize: 12,
            color: "#475569",
            lineHeight: 1.5,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            direction: /[\u0590-\u05FF]/.test(node.body) ? "rtl" : "ltr",
          }}
        >
          {node.body}
        </div>
      )}

      {/* Tags */}
      {node.tags && (
        <div style={{ padding: "4px 10px 8px", display: "flex", flexWrap: "wrap", gap: 4 }}>
          {node.tags.split(",").filter(Boolean).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.08)",
                color: "#475569",
              }}
            >
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Connection handle — shown on hover */}
      <div
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          position: "absolute",
          right: -10,
          top: "50%",
          transform: "translateY(-50%)",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#6366f1",
          border: "2px solid white",
          cursor: "crosshair",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onConnectStart(e, node.id);
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />
      </div>

      {/* Left handle for incoming connections */}
      <div
        style={{
          position: "absolute",
          left: -8,
          top: "50%",
          transform: "translateY(-50%)",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "rgba(99,102,241,0.2)",
          border: "2px solid rgba(99,102,241,0.4)",
          pointerEvents: "none",
        }}
      />

      {/* Node ID badge (small, bottom-right) */}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          right: 6,
          fontSize: 9,
          color: "rgba(0,0,0,0.3)",
          fontFamily: "monospace",
        }}
      >
        #{node.id}
      </div>
    </div>
  );
});

// ─── SVG Edges ────────────────────────────────────────────────────────────────

function EdgeArrow({
  from,
  to,
  label,
  type,
  selected,
  onClick,
}: {
  from: Point;
  to: Point;
  label?: string;
  type: string;
  selected: boolean;
  onClick: () => void;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;

  // Bezier control points
  const cx1 = from.x + dx * 0.4;
  const cy1 = from.y;
  const cx2 = to.x - dx * 0.4;
  const cy2 = to.y;

  const path = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;

  const isBlocking = type === "blocks" || type === "blocked_by" || type === "depends_on";
  const strokeColor = selected ? "#6366f1" : isBlocking ? "#ef4444" : "#94a3b8";
  const strokeDash = isBlocking ? "6 3" : undefined;

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Invisible wider hit area */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={12} />
      {/* Visible path */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={selected ? 2.5 : 1.8}
        strokeDasharray={strokeDash}
        markerEnd={`url(#arrowhead-${selected ? "selected" : isBlocking ? "blocking" : "default"})`}
      />
      {/* Label */}
      {label && (
        <g transform={`translate(${mx}, ${my})`}>
          <rect
            x={-label.length * 3.5}
            y={-10}
            width={label.length * 7}
            height={18}
            rx={4}
            fill="white"
            stroke={strokeColor}
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill={strokeColor}
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

// ─── Main Canvas ──────────────────────────────────────────────────────────────

interface InfiniteCanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onNodeMove: (id: number, x: number, y: number) => void;
  onNodeClick: (id: number) => void;
  onEdgeCreate: (fromId: number, toId: number) => void;
  onEdgeDelete: (edgeId: number) => void;
  onAddNode: (type: NodeType, x: number, y: number) => void;
  selectedNodeId?: number | null;
  selectedEdgeId?: number | null;
  onSelectNode: (id: number | null) => void;
  onSelectEdge: (id: number | null) => void;
}

export function InfiniteCanvas({
  nodes,
  edges,
  onNodeMove,
  onNodeClick,
  onEdgeCreate,
  onEdgeDelete,
  onAddNode,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
}: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

  // Interaction state
  const [tool, setTool] = useState<"select" | "sticky" | "task" | "connect">("select");
  const draggingNodeRef = useRef<{ id: number; startX: number; startY: number; mouseX: number; mouseY: number } | null>(null);
  const panningRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const connectingRef = useRef<{ fromId: number; startX: number; startY: number } | null>(null);
  const [connectingLine, setConnectingLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Node positions overrides (for smooth dragging before committing to DB)
  const [localPositions, setLocalPositions] = useState<Map<number, Point>>(new Map());

  // ── Zoom ──
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ── Mouse events ──
  const screenToCanvas = useCallback(
    (sx: number, sy: number): Point => {
      const rect = containerRef.current!.getBoundingClientRect();
      return {
        x: (sx - rect.left - pan.x) / zoom,
        y: (sy - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      // Clicking on empty canvas → pan
      if ((e.target as HTMLElement).closest("[data-canvas-card]")) return;
      panningRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      onSelectNode(null);
      onSelectEdge(null);
    },
    [pan, onSelectNode, onSelectEdge]
  );

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: number) => {
      if (tool === "connect") return;
      e.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const pos = localPositions.get(nodeId) ?? { x: node.canvasX, y: node.canvasY };
      draggingNodeRef.current = {
        id: nodeId,
        startX: pos.x,
        startY: pos.y,
        mouseX: e.clientX,
        mouseY: e.clientY,
      };
    },
    [nodes, localPositions, tool]
  );

  const handleConnectStart = useCallback(
    (e: React.MouseEvent, nodeId: number) => {
      e.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const pos = localPositions.get(nodeId) ?? { x: node.canvasX, y: node.canvasY };
      const w = node.width ?? DEFAULT_CARD_WIDTH;
      connectingRef.current = {
        fromId: nodeId,
        startX: pos.x + w,
        startY: pos.y + (node.height ?? DEFAULT_CARD_HEIGHT) / 2,
      };
      const cp = screenToCanvas(e.clientX, e.clientY);
      setConnectingLine({
        x1: pos.x + w,
        y1: pos.y + (node.height ?? DEFAULT_CARD_HEIGHT) / 2,
        x2: cp.x,
        y2: cp.y,
      });
    },
    [nodes, localPositions, screenToCanvas]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Panning
      if (panningRef.current) {
        const dx = e.clientX - panningRef.current.startX;
        const dy = e.clientY - panningRef.current.startY;
        setPan({ x: panningRef.current.panX + dx, y: panningRef.current.panY + dy });
        return;
      }

      // Dragging a node
      if (draggingNodeRef.current) {
        const dx = (e.clientX - draggingNodeRef.current.mouseX) / zoom;
        const dy = (e.clientY - draggingNodeRef.current.mouseY) / zoom;
        setLocalPositions((prev) => {
          const next = new Map(prev);
          next.set(draggingNodeRef.current!.id, {
            x: draggingNodeRef.current!.startX + dx,
            y: draggingNodeRef.current!.startY + dy,
          });
          return next;
        });
        return;
      }

      // Drawing connection line
      if (connectingRef.current) {
        const cp = screenToCanvas(e.clientX, e.clientY);
        setConnectingLine({
          x1: connectingRef.current.startX,
          y1: connectingRef.current.startY,
          x2: cp.x,
          y2: cp.y,
        });
      }
    },
    [zoom, screenToCanvas]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // Finish panning
      if (panningRef.current) {
        panningRef.current = null;
        return;
      }

      // Finish dragging node
      if (draggingNodeRef.current) {
        const { id } = draggingNodeRef.current;
        const pos = localPositions.get(id);
        if (pos) {
          onNodeMove(id, Math.round(pos.x), Math.round(pos.y));
        }
        draggingNodeRef.current = null;
        return;
      }

      // Finish connecting
      if (connectingRef.current) {
        const fromId = connectingRef.current.fromId;
        connectingRef.current = null;
        setConnectingLine(null);

        // Find which card the mouse is over
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const cardEl = target?.closest("[data-node-id]") as HTMLElement | null;
        if (cardEl) {
          const toId = parseInt(cardEl.dataset.nodeId ?? "0", 10);
          if (toId && toId !== fromId) {
            onEdgeCreate(fromId, toId);
          }
        }
      }
    },
    [localPositions, onNodeMove, onEdgeCreate]
  );

  // ── Click on canvas to add node ──
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool === "sticky" || tool === "task") {
        const cp = screenToCanvas(e.clientX, e.clientY);
        onAddNode(tool === "sticky" ? "note" : "task", cp.x, cp.y);
        setTool("select");
      }
    },
    [tool, screenToCanvas, onAddNode]
  );

  // ── Compute edge endpoints ──
  const edgeLines = useMemo(() => {
    return edges.map((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.fromNodeId);
      const toNode = nodes.find((n) => n.id === edge.toNodeId);
      if (!fromNode || !toNode) return null;

      const fromPos = localPositions.get(fromNode.id) ?? { x: fromNode.canvasX, y: fromNode.canvasY };
      const toPos = localPositions.get(toNode.id) ?? { x: toNode.canvasX, y: toNode.canvasY };

      const fw = fromNode.width ?? DEFAULT_CARD_WIDTH;
      const fh = fromNode.height ?? DEFAULT_CARD_HEIGHT;
      const tw = toNode.width ?? DEFAULT_CARD_WIDTH;
      const th = toNode.height ?? DEFAULT_CARD_HEIGHT;

      return {
        edge,
        from: { x: fromPos.x + fw, y: fromPos.y + fh / 2 },
        to: { x: toPos.x, y: toPos.y + th / 2 },
      };
    }).filter(Boolean) as { edge: CanvasEdge; from: Point; to: Point }[];
  }, [edges, nodes, localPositions]);

  // ── Render ──
  const canvasStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background: "#fafafa",
    cursor: panningRef.current
      ? "grabbing"
      : tool === "sticky" || tool === "task"
      ? "crosshair"
      : "default",
  };

  const worldStyle: React.CSSProperties = {
    position: "absolute",
    transformOrigin: "0 0",
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    width: "100%",
    height: "100%",
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* ── Toolbar ── */}
      <CanvasToolbar
        tool={tool}
        setTool={setTool}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))}
        onZoomOut={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))}
        onFitView={() => { setZoom(1); setPan({ x: 80, y: 80 }); }}
        selectedEdgeId={selectedEdgeId}
        onDeleteEdge={selectedEdgeId != null ? () => onEdgeDelete(selectedEdgeId) : undefined}
      />

      {/* ── Canvas area ── */}
      <div
        ref={containerRef}
        style={canvasStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Dot grid background */}
        <DotGrid zoom={zoom} pan={pan} />

        {/* World (panned + zoomed) */}
        <div style={worldStyle}>
          {/* SVG layer for edges */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              overflow: "visible",
              pointerEvents: "none",
            }}
          >
            <defs>
              <marker id="arrowhead-default" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
              <marker id="arrowhead-blocking" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
              </marker>
              <marker id="arrowhead-selected" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
              </marker>
            </defs>

            {/* Edges */}
            {edgeLines.map(({ edge, from, to }) => (
              <EdgeArrow
                key={edge.id}
                from={from}
                to={to}
                label={edge.label ?? edge.type}
                type={edge.type}
                selected={selectedEdgeId === edge.id}
                onClick={() => onSelectEdge(selectedEdgeId === edge.id ? null : edge.id)}
              />
            ))}

            {/* Live connection line while drawing */}
            {connectingLine && (
              <line
                x1={connectingLine.x1}
                y1={connectingLine.y1}
                x2={connectingLine.x2}
                y2={connectingLine.y2}
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="6 3"
                markerEnd="url(#arrowhead-selected)"
              />
            )}
          </svg>

          {/* Node cards */}
          {nodes.map((node) => {
            const pos = localPositions.get(node.id) ?? { x: node.canvasX, y: node.canvasY };
            const displayNode = { ...node, canvasX: pos.x, canvasY: pos.y };
            return (
              <div key={node.id} data-canvas-card data-node-id={node.id}>
                <NodeCard
                  node={displayNode}
                  selected={selectedNodeId === node.id}
                  connecting={connectingRef.current?.fromId === node.id}
                  onMouseDown={handleNodeMouseDown}
                  onConnectStart={handleConnectStart}
                  onClick={(id) => { onSelectNode(id); onSelectEdge(null); }}
                  onDoubleClick={onNodeClick}
                  zoom={zoom}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Zoom indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "4px 10px",
          fontSize: 12,
          color: "#64748b",
          fontWeight: 500,
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

// ─── Dot Grid ─────────────────────────────────────────────────────────────────

function DotGrid({ zoom, pan }: { zoom: number; pan: Point }) {
  const dotSize = Math.max(1, zoom);
  const spacing = GRID_SIZE * zoom;
  const offsetX = ((pan.x % spacing) + spacing) % spacing;
  const offsetY = ((pan.y % spacing) + spacing) % spacing;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <defs>
        <pattern
          id="dot-grid"
          x={offsetX}
          y={offsetY}
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={dotSize / 2} cy={dotSize / 2} r={dotSize * 0.6} fill="#cbd5e1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-grid)" />
    </svg>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function CanvasToolbar({
  tool,
  setTool,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  selectedEdgeId,
  onDeleteEdge,
}: {
  tool: string;
  setTool: (t: "select" | "sticky" | "task" | "connect") => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  selectedEdgeId?: number | null;
  onDeleteEdge?: () => void;
}) {
  const tools = [
    { id: "select" as const, icon: <MousePointer2 size={18} />, label: "Select (V)" },
    { id: "sticky" as const, icon: <StickyNote size={18} />, label: "Add sticky note" },
    { id: "task" as const, icon: <Square size={18} />, label: "Add task card" },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "8px 6px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}
      >
        {tools.map((t) => (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTool(t.id)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "none",
                  background: tool === t.id ? "#6366f1" : "transparent",
                  color: tool === t.id ? "white" : "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                {t.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{t.label}</TooltipContent>
          </Tooltip>
        ))}

        <div style={{ width: "100%", height: 1, background: "#e2e8f0", margin: "4px 0" }} />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onZoomIn}
              style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "transparent", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ZoomIn size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Zoom in</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onZoomOut}
              style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "transparent", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ZoomOut size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Zoom out</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onFitView}
              style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "transparent", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Maximize2 size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Reset view</TooltipContent>
        </Tooltip>

        {selectedEdgeId != null && onDeleteEdge && (
          <>
            <div style={{ width: "100%", height: 1, background: "#e2e8f0", margin: "4px 0" }} />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onDeleteEdge}
                  style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "#fee2e2", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Unlink size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Delete connection</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
