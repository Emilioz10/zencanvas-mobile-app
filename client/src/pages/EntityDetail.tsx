/**
 * EntityDetail — view/edit a single ontological entity
 * Shows: name, type, domain, tags, Markdown body (rendered), linked entities (bi-directional)
 */
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import HebMd from "@/components/HebMd";

// ── Entity type config ───────────────────────────────────────────────────────
const ENTITY_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  person:      { label: "אדם",       icon: "👤", color: "#f59e0b" },
  document:    { label: "מסמך",      icon: "📄", color: "#6366f1" },
  task:        { label: "משימה",     icon: "✅", color: "#3b82f6" },
  project:     { label: "פרויקט",   icon: "📁", color: "#8b5cf6" },
  medication:  { label: "תרופה",    icon: "💊", color: "#ef4444" },
  money:       { label: "כסף",      icon: "💰", color: "#10b981" },
  place:       { label: "מקום",     icon: "📍", color: "#f97316" },
  event:       { label: "אירוע",    icon: "📅", color: "#06b6d4" },
  concept:     { label: "מושג",     icon: "💡", color: "#eab308" },
  tool:        { label: "כלי",      icon: "🔧", color: "#64748b" },
  debt:        { label: "חוב",      icon: "📋", color: "#dc2626" },
  appointment: { label: "פגישה",    icon: "🗓️", color: "#7c3aed" },
  guide:       { label: "מדריך",    icon: "📖", color: "#059669" },
  contact:     { label: "איש קשר",  icon: "📞", color: "#0284c7" },
  goal:        { label: "מטרה",     icon: "🎯", color: "#be185d" },
};

const LINK_TYPES: Record<string, { label: string; color: string }> = {
  related:    { label: "קשור ל",      color: "#6366f1" },
  depends_on: { label: "תלוי ב",      color: "#f59e0b" },
  blocks:     { label: "חוסם",        color: "#ef4444" },
  part_of:    { label: "חלק מ",       color: "#8b5cf6" },
  references: { label: "מפנה ל",      color: "#3b82f6" },
  caused_by:  { label: "נגרם על ידי", color: "#dc2626" },
  resolves:   { label: "פותר",        color: "#10b981" },
  owns:       { label: "שייך ל",      color: "#64748b" },
};

const DOMAINS: Record<string, { label: string; icon: string }> = {
  health:  { label: "בריאות",  icon: "❤️" },
  money:   { label: "כסף",     icon: "💰" },
  family:  { label: "משפחה",   icon: "👨‍👩‍👧" },
  work:    { label: "עבודה",   icon: "💼" },
  admin:   { label: "בירוקרטיה", icon: "📋" },
  self:    { label: "עצמי",    icon: "🧠" },
};

// ── Main component ───────────────────────────────────────────────────────────
export default function EntityDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id ?? "0");

  const { data, isLoading, refetch } = trpc.entities.get.useQuery(
    { id },
    { enabled: id > 0 }
  );

  const updateMutation = trpc.entities.update.useMutation({
    onSuccess: () => { refetch(); setEditing(false); }
  });
  const linkMutation = trpc.entities.link.useMutation({
    onSuccess: () => { refetch(); setShowLinkSheet(false); }
  });
  const unlinkMutation = trpc.entities.unlink.useMutation({
    onSuccess: () => refetch()
  });
  const deleteMutation = trpc.entities.delete.useMutation({
    onSuccess: () => setLocation("/entities")
  });

  const { data: allEntities } = trpc.entities.list.useQuery({});

  const [editing, setEditing] = useState(false);
  const [showLinkSheet, setShowLinkSheet] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");
  const [linkTarget, setLinkTarget] = useState<number | null>(null);
  const [linkType, setLinkType] = useState<string>("related");
  const [bodyTab, setBodyTab] = useState<"edit" | "preview">("preview");

  useEffect(() => {
    if (data?.entity) {
      setEditName(data.entity.name);
      setEditBody(data.entity.body ?? "");
      setEditTags(data.entity.tags ?? "");
      setEditDomain(data.entity.domain ?? "");
      setEditColor(data.entity.color ?? "#6366f1");
    }
  }, [data?.entity]);

  if (isLoading) {
    return (
      <div dir="rtl" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ color: "#94a3b8", fontSize: 16 }}>טוען...</div>
      </div>
    );
  }

  if (!data?.entity) {
    return (
      <div dir="rtl" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", gap: 16 }}>
        <div style={{ fontSize: 48 }}>❓</div>
        <div style={{ color: "#64748b" }}>האובייקט לא נמצא</div>
        <button onClick={() => setLocation("/entities")} style={{ padding: "10px 20px", borderRadius: 10, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer" }}>
          חזור לרשימה
        </button>
      </div>
    );
  }

  const { entity, outgoing, incoming, linkedEntities } = data;
  const typeConfig = ENTITY_TYPES[entity.entityType] ?? { label: entity.entityType, icon: "📌", color: "#6366f1" };
  const tags = entity.tags ? entity.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

  const getLinkedEntity = (id: number) => linkedEntities.find(e => e.id === id);

  return (
    <div dir="rtl" style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: '"Heebo", Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: entity.color ?? typeConfig.color,
        padding: "20px 16px 16px",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button
            onClick={() => setLocation("/entities")}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 14 }}
          >
            ← חזור
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setEditing(!editing)}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 14 }}
            >
              {editing ? "ביטול" : "✏️ ערוך"}
            </button>
            <button
              onClick={() => { if (confirm("למחוק?")) deleteMutation.mutate({ id }) }}
              style={{ background: "rgba(220,38,38,0.3)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 14 }}
            >
              🗑️
            </button>
          </div>
        </div>

        {editing ? (
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            style={{ fontSize: 22, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 10px", width: "100%", direction: "rtl" }}
          />
        ) : (
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
            {typeConfig.icon} {entity.name}
          </h1>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 12 }}>
            {typeConfig.label}
          </span>
          {entity.domain && DOMAINS[entity.domain] && (
            <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 12 }}>
              {DOMAINS[entity.domain].icon} {DOMAINS[entity.domain].label}
            </span>
          )}
          {tags.map(tag => (
            <span key={tag} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 12 }}>
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 120px" }}>

        {/* Edit fields */}
        {editing && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>תגיות (מופרדות בפסיק)</label>
              <input
                value={editTags}
                onChange={e => setEditTags(e.target.value)}
                placeholder="תגית1, תגית2"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", direction: "rtl", fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>תחום חיים</label>
              <select
                value={editDomain}
                onChange={e => setEditDomain(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", direction: "rtl", fontSize: 14 }}
              >
                <option value="">ללא</option>
                {Object.entries(DOMAINS).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>צבע</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#8b5cf6","#f97316","#06b6d4"].map(c => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: editColor === c ? "3px solid #1e293b" : "2px solid transparent", cursor: "pointer" }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={() => updateMutation.mutate({ id, name: editName, body: editBody, tags: editTags, domain: editDomain, color: editColor })}
              disabled={updateMutation.isPending}
              style={{ width: "100%", padding: "12px", borderRadius: 10, background: "#6366f1", color: "#fff", border: "none", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
            >
              {updateMutation.isPending ? "שומר..." : "שמור שינויים"}
            </button>
          </div>
        )}

        {/* Body / Markdown */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>תוכן</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setBodyTab("preview")}
                style={{ padding: "4px 10px", borderRadius: 6, background: bodyTab === "preview" ? "#6366f1" : "#f1f5f9", color: bodyTab === "preview" ? "#fff" : "#64748b", border: "none", cursor: "pointer", fontSize: 12 }}
              >
                תצוגה
              </button>
              <button
                onClick={() => setBodyTab("edit")}
                style={{ padding: "4px 10px", borderRadius: 6, background: bodyTab === "edit" ? "#6366f1" : "#f1f5f9", color: bodyTab === "edit" ? "#fff" : "#64748b", border: "none", cursor: "pointer", fontSize: 12 }}
              >
                עריכה
              </button>
            </div>
          </div>

          {bodyTab === "preview" ? (
            entity.body ? (
              <HebMd>{entity.body}</HebMd>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
                אין תוכן עדיין. לחץ "עריכה" להוסיף.
              </div>
            )
          ) : (
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              placeholder="כתוב כאן... תומך Markdown עברי&#10;&#10;## כותרת&#10;- פריט&#10;**מודגש**&#10;[[קישור לאובייקט]]"
              rows={12}
              style={{
                width: "100%", padding: "10px", borderRadius: 8,
                border: "1px solid #e2e8f0", direction: "rtl",
                fontSize: 14, lineHeight: 1.7, resize: "vertical",
                fontFamily: '"Heebo", Arial, sans-serif',
              }}
            />
          )}

          {bodyTab === "edit" && (
            <button
              onClick={() => { updateMutation.mutate({ id, body: editBody }); setBodyTab("preview"); }}
              style={{ marginTop: 10, padding: "8px 16px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontSize: 14 }}
            >
              שמור תוכן
            </button>
          )}
        </div>

        {/* Linked entities */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
              קישורים ({outgoing.length + incoming.length})
            </span>
            <button
              onClick={() => setShowLinkSheet(true)}
              style={{ padding: "5px 12px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}
            >
              + קשר
            </button>
          </div>

          {outgoing.length === 0 && incoming.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "12px 0" }}>
              אין קישורים עדיין
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {outgoing.map(link => {
                const target = getLinkedEntity(link.toEntityId);
                const lt = LINK_TYPES[link.linkType] ?? { label: link.linkType, color: "#6366f1" };
                const tc = target ? (ENTITY_TYPES[target.entityType] ?? { icon: "📌", color: "#6366f1" }) : null;
                return (
                  <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: 10, color: lt.color, background: `${lt.color}18`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }}>
                      {lt.label}
                    </span>
                    <button
                      onClick={() => target && setLocation(`/entity/${target.id}`)}
                      style={{ flex: 1, textAlign: "right", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#1e293b", fontWeight: 500 }}
                    >
                      {tc?.icon} {target?.name ?? `#${link.toEntityId}`}
                    </button>
                    <button
                      onClick={() => unlinkMutation.mutate({ linkId: link.id })}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16 }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              {incoming.map(link => {
                const source = getLinkedEntity(link.fromEntityId);
                const lt = LINK_TYPES[link.linkType] ?? { label: link.linkType, color: "#6366f1" };
                const sc = source ? (ENTITY_TYPES[source.entityType] ?? { icon: "📌", color: "#6366f1" }) : null;
                return (
                  <div key={`in-${link.id}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }}>
                      ← {lt.label}
                    </span>
                    <button
                      onClick={() => source && setLocation(`/entity/${source.id}`)}
                      style={{ flex: 1, textAlign: "right", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#1e293b", fontWeight: 500 }}
                    >
                      {sc?.icon} {source?.name ?? `#${link.fromEntityId}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            נוצר: {new Date(entity.createdAt).toLocaleDateString("he-IL")} ·
            עודכן: {new Date(entity.updatedAt).toLocaleDateString("he-IL")}
          </div>
        </div>
      </div>

      {/* Add link bottom sheet */}
      {showLinkSheet && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }}
            onClick={() => setShowLinkSheet(false)}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
            background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "20px 16px 40px", maxHeight: "80dvh", overflowY: "auto",
          }}>
            <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px", direction: "rtl" }}>קשר לאובייקט</h2>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>סוג קישור</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(LINK_TYPES).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setLinkType(k)}
                    style={{
                      padding: "6px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                      background: linkType === k ? v.color : "#f1f5f9",
                      color: linkType === k ? "#fff" : "#475569",
                      border: "none",
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>בחר אובייקט</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
                {(allEntities ?? []).filter(e => e.id !== id).map(e => {
                  const tc = ENTITY_TYPES[e.entityType] ?? { icon: "📌", color: "#6366f1" };
                  return (
                    <button
                      key={e.id}
                      onClick={() => setLinkTarget(e.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", borderRadius: 10, textAlign: "right",
                        background: linkTarget === e.id ? "#ede9fe" : "#f8fafc",
                        border: `1.5px solid ${linkTarget === e.id ? "#8b5cf6" : "#e2e8f0"}`,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{tc.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{tc.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                if (!linkTarget) return;
                linkMutation.mutate({ fromEntityId: id, toEntityId: linkTarget, linkType: linkType as any });
              }}
              disabled={!linkTarget || linkMutation.isPending}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: linkTarget ? "#6366f1" : "#e2e8f0",
                color: linkTarget ? "#fff" : "#94a3b8",
                border: "none", fontWeight: 600, fontSize: 15, cursor: linkTarget ? "pointer" : "default",
              }}
            >
              {linkMutation.isPending ? "מקשר..." : "צור קישור"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
