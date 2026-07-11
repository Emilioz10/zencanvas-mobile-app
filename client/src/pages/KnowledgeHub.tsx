/**
 * KnowledgeHub — מרכז הידע
 *
 * רשימת כל האובייקטים עם:
 * - פילטר לפי סוג (מושג, מסמך, אדם, מקום...)
 * - פילטר לפי תחום חיים
 * - חיפוש חופשי
 * - תצוגה מקדימה inline
 * - יצירה מהירה
 * - גרף קשרים (Obsidian-style)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import HebMd from "@/components/HebMd";

const HEB_TYPES = [
  { value: "concept",    label: "מושג",       icon: "💡", color: "#6366f1" },
  { value: "document",   label: "מסמך",        icon: "📄", color: "#0ea5e9" },
  { value: "person",     label: "אדם",         icon: "👤", color: "#f59e0b" },
  { value: "place",      label: "מקום",        icon: "📍", color: "#10b981" },
  { value: "event",      label: "אירוע",       icon: "📅", color: "#8b5cf6" },
  { value: "process",    label: "תהליך",       icon: "🔄", color: "#06b6d4" },
  { value: "protocol",   label: "פרוטוקול",    icon: "📋", color: "#64748b" },
  { value: "medication", label: "תרופה",       icon: "💊", color: "#ef4444" },
  { value: "money",      label: "כסף",         icon: "💰", color: "#16a34a" },
  { value: "tool",       label: "כלי",         icon: "🔧", color: "#78716c" },
  { value: "guide",      label: "מדריך",       icon: "📖", color: "#d97706" },
  { value: "goal",       label: "מטרה",        icon: "🎯", color: "#e11d48" },
  { value: "task",       label: "משימה",       icon: "✅", color: "#0891b2" },
  { value: "project",    label: "פרויקט",      icon: "🗂️", color: "#7c3aed" },
];

const DOMAINS = [
  { value: "health",  label: "בריאות",    icon: "🏥" },
  { value: "money",   label: "כספים",     icon: "💰" },
  { value: "family",  label: "משפחה",     icon: "👨‍👩‍👧" },
  { value: "admin",   label: "בירוקרטיה", icon: "🏛️" },
  { value: "self",    label: "עצמי",      icon: "🧠" },
  { value: "work",    label: "עבודה",     icon: "💼" },
  { value: "home",    label: "בית",       icon: "🏠" },
  { value: "spirit",  label: "רוחני",     icon: "✡️" },
];

type EntityRow = {
  id: number;
  name: string;
  entityType: string;
  icon: string | null;
  color: string | null;
  body: string | null;
  tags: string | null;
  domain: string | null;
  updatedAt: Date;
};

function EntityCard({
  entity,
  onClick,
  onEdit,
}: {
  entity: EntityRow;
  onClick: () => void;
  onEdit: () => void;
}) {
  const t = HEB_TYPES.find(x => x.value === entity.entityType);
  const color = t?.color ?? "#6366f1";
  const preview = (entity.body ?? "").slice(0, 120);

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: `1.5px solid ${color}30`,
        borderRadius: 14,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.1s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        direction: "rtl",
        position: "relative",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Type badge */}
      <div style={{
        position: "absolute", top: 12, left: 12,
        padding: "2px 8px", borderRadius: 12,
        background: color + "18", color, fontSize: 11, fontWeight: 700,
        border: `1px solid ${color}30`,
      }}>
        {t?.icon} {t?.label}
      </div>

      {/* Edit button */}
      <button
        onClick={e => { e.stopPropagation(); onEdit(); }}
        style={{
          position: "absolute", top: 10, right: 10,
          background: "none", border: "none", fontSize: 16,
          cursor: "pointer", color: "#94a3b8", padding: 4,
        }}
      >
        ✏️
      </button>

      {/* Name */}
      <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 6, paddingTop: 24, paddingLeft: 60 }}>
        {entity.icon ?? t?.icon} {entity.name}
      </div>

      {/* Preview */}
      {preview && (
        <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, marginBottom: 8 }}>
          {preview}{(entity.body ?? "").length > 120 ? "..." : ""}
        </div>
      )}

      {/* Tags */}
      {entity.tags && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {entity.tags.split(",").filter(Boolean).map(tag => (
            <span
              key={tag}
              style={{
                padding: "2px 8px", borderRadius: 10, fontSize: 11,
                background: "#f1f5f9", color: "#64748b",
              }}
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Domain */}
      {entity.domain && (
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
          {DOMAINS.find(d => d.value === entity.domain)?.icon} {DOMAINS.find(d => d.value === entity.domain)?.label}
        </div>
      )}
    </div>
  );
}

// ─── Quick create dialog ──────────────────────────────────────────────────────

function QuickCreate({ onClose, onCreate }: { onClose: () => void; onCreate: (id: number) => void }) {
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("concept");
  const [domain, setDomain] = useState("");

  const create = trpc.entities.create.useMutation({
    onSuccess: (data) => {
      if (data) onCreate(data.id);
    },
    onError: () => toast.error("שגיאה ביצירה"),
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 300,
      display: "flex", alignItems: "flex-end",
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px 20px 0 0",
        padding: "24px 20px 40px", width: "100%",
        direction: "rtl",
      }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>אובייקט חדש</h3>

        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="שם האובייקט..."
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 12,
            border: "1.5px solid #e2e8f0", fontSize: 16, direction: "rtl",
            outline: "none", marginBottom: 12, boxSizing: "border-box",
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && name.trim()) {
              const validType = entityType as "person" | "document" | "task" | "project" | "medication" | "money" | "place" | "event" | "concept" | "tool" | "debt" | "appointment" | "guide" | "contact" | "goal";
              create.mutate({ name, entityType: validType, domain });
            }
          }}
        />

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {HEB_TYPES.slice(0, 8).map(t => (
            <button
              key={t.value}
              onClick={() => setEntityType(t.value)}
              style={{
                padding: "8px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                background: entityType === t.value ? t.color : "#f1f5f9",
                color: entityType === t.value ? "#fff" : "#64748b",
                border: `1.5px solid ${entityType === t.value ? t.color : "#e2e8f0"}`,
                cursor: "pointer",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <select
          value={domain}
          onChange={e => setDomain(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 12,
            border: "1.5px solid #e2e8f0", fontSize: 14, direction: "rtl",
            marginBottom: 16, boxSizing: "border-box",
          }}
        >
          <option value="">ללא תחום</option>
          {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.icon} {d.label}</option>)}
        </select>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              if (!name.trim()) { toast.error("חסר שם"); return; }
              const validType = entityType as "person" | "document" | "task" | "project" | "medication" | "money" | "place" | "event" | "concept" | "tool" | "debt" | "appointment" | "guide" | "contact" | "goal";
              create.mutate({ name, entityType: validType, domain });
            }}
            disabled={create.isPending || !name.trim()}
            style={{
              flex: 1, padding: "14px", background: "#6366f1", color: "#fff",
              border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15,
              cursor: "pointer",
            }}
          >
            {create.isPending ? "⏳ יוצר..." : "✓ צור"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "14px 20px", background: "#f1f5f9", color: "#64748b",
              border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15,
              cursor: "pointer",
            }}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function KnowledgeHub() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const { data: entities = [], isLoading, refetch } = trpc.entities.list.useQuery(
    filterType || filterDomain ? { entityType: filterType || undefined, domain: filterDomain || undefined } : undefined,
    { enabled: isAuthenticated }
  );

  const { data: previewEntity } = trpc.entities.get.useQuery(
    { id: previewId! },
    { enabled: !!previewId && isAuthenticated }
  );

  const deleteEntity = trpc.entities.delete.useMutation({
    onSuccess: () => { toast.success("נמחק"); refetch(); },
    onError: () => toast.error("שגיאה במחיקה"),
  });

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, direction: "rtl" }}>
        <div style={{ fontSize: 48 }}>🧠</div>
        <h2 style={{ margin: 0 }}>מרכז הידע</h2>
        <p style={{ color: "#64748b", textAlign: "center" }}>התחבר כדי לגשת לאובייקטים שלך</p>
        <a href={getLoginUrl()} style={{
          padding: "14px 28px", background: "#6366f1", color: "#fff",
          borderRadius: 14, fontWeight: 700, fontSize: 16, textDecoration: "none",
        }}>
          התחברות
        </a>
      </div>
    );
  }

  // Filter by search
  const filtered = entities.filter(e =>
    !search ||
    e.name.includes(search) ||
    (e.body ?? "").includes(search) ||
    (e.tags ?? "").includes(search)
  );

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", direction: "rtl" }}>

      {/* ── Header ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "16px 16px 12px", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button
            onClick={() => setLocation("/")}
            style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, flex: 1 }}>🧠 מרכז הידע</h1>
          <button
            onClick={() => setLocation("/knowledge/graph")}
            style={{
              padding: "8px 14px", background: "#f5f3ff", color: "#6366f1",
              border: "1.5px solid #c4b5fd", borderRadius: 10, fontSize: 13,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            🕸️ גרף
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: "10px 16px", background: "#6366f1", color: "#fff",
              border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + חדש
          </button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 חיפוש..."
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 12,
            border: "1.5px solid #e2e8f0", fontSize: 14, direction: "rtl",
            outline: "none", boxSizing: "border-box", marginBottom: 10,
          }}
        />

        {/* Type filters */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          <button
            onClick={() => setFilterType("")}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: !filterType ? "#6366f1" : "#f1f5f9",
              color: !filterType ? "#fff" : "#64748b",
              border: `1.5px solid ${!filterType ? "#6366f1" : "#e2e8f0"}`,
              cursor: "pointer", flexShrink: 0,
            }}
          >
            הכל ({entities.length})
          </button>
          {HEB_TYPES.map(t => {
            const count = entities.filter(e => e.entityType === t.value).length;
            if (count === 0) return null;
            return (
              <button
                key={t.value}
                onClick={() => setFilterType(filterType === t.value ? "" : t.value)}
                style={{
                  padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: filterType === t.value ? t.color : "#f1f5f9",
                  color: filterType === t.value ? "#fff" : "#64748b",
                  border: `1.5px solid ${filterType === t.value ? t.color : "#e2e8f0"}`,
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                {t.icon} {t.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Domain filters */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingTop: 6 }}>
          {DOMAINS.map(d => {
            const count = entities.filter(e => e.domain === d.value).length;
            if (count === 0) return null;
            return (
              <button
                key={d.value}
                onClick={() => setFilterDomain(filterDomain === d.value ? "" : d.value)}
                style={{
                  padding: "5px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600,
                  background: filterDomain === d.value ? "#1e293b" : "#f8fafc",
                  color: filterDomain === d.value ? "#fff" : "#64748b",
                  border: "1.5px solid #e2e8f0",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                {d.icon} {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Entity list ── */}
      <div style={{ padding: "16px 16px 100px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
            ⏳ טוען...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
            <div style={{ fontSize: 16, color: "#64748b", marginBottom: 20 }}>
              {search ? "לא נמצאו תוצאות" : "אין אובייקטים עדיין"}
            </div>
            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  padding: "12px 24px", background: "#6366f1", color: "#fff",
                  border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                + צור אובייקט ראשון
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map(entity => (
              <EntityCard
                key={entity.id}
                entity={entity as EntityRow}
                onClick={() => setPreviewId(previewId === entity.id ? null : entity.id)}
                onEdit={() => setLocation(`/knowledge/${entity.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Inline preview panel ── */}
      {previewId && previewEntity && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
          background: "#fff", borderTop: "2px solid #6366f1",
          borderRadius: "20px 20px 0 0",
          maxHeight: "70dvh", overflowY: "auto",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
          direction: "rtl",
        }}>
          <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, flex: 1 }}>
              {previewEntity.entity.icon ?? "📌"} {previewEntity.entity.name}
            </h2>
            <button
              onClick={() => setLocation(`/knowledge/${previewId}`)}
              style={{
                padding: "8px 14px", background: "#6366f1", color: "#fff",
                border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer",
              }}
            >
              ✏️ ערוך
            </button>
            <button
              onClick={() => setPreviewId(null)}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: "12px 16px 32px" }}>
            {previewEntity.entity.body ? (
              <HebMd>{previewEntity.entity.body}</HebMd>
            ) : (
              <p style={{ color: "#94a3b8" }}>אין תוכן — לחץ ערוך להוספה</p>
            )}

            {/* Linked entities */}
            {previewEntity.linkedEntities.length > 0 && (
              <div style={{ marginTop: 16, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>קישורים:</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {previewEntity.linkedEntities.map(linked => {
                    const t = HEB_TYPES.find(x => x.value === linked.entityType);
                    return (
                      <button
                        key={linked.id}
                        onClick={() => setPreviewId(linked.id)}
                        style={{
                          padding: "6px 12px", borderRadius: 20, fontSize: 13,
                          background: (t?.color ?? "#6366f1") + "18",
                          color: t?.color ?? "#6366f1",
                          border: `1.5px solid ${(t?.color ?? "#6366f1")}30`,
                          cursor: "pointer",
                        }}
                      >
                        {t?.icon} {linked.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quick create ── */}
      {showCreate && (
        <QuickCreate
          onClose={() => setShowCreate(false)}
          onCreate={id => {
            setShowCreate(false);
            refetch();
            setLocation(`/knowledge/${id}`);
          }}
        />
      )}
    </div>
  );
}
