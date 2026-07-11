/**
 * EntityHub — the ontological objects browser
 * Lists all entities grouped by type, with domain filter, search, and quick-create
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const ENTITY_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  person:      { label: "אדם",         icon: "👤", color: "#f59e0b" },
  document:    { label: "מסמך",        icon: "📄", color: "#6366f1" },
  task:        { label: "משימה",       icon: "✅", color: "#3b82f6" },
  project:     { label: "פרויקט",     icon: "📁", color: "#8b5cf6" },
  medication:  { label: "תרופה",      icon: "💊", color: "#ef4444" },
  money:       { label: "כסף",        icon: "💰", color: "#10b981" },
  place:       { label: "מקום",       icon: "📍", color: "#f97316" },
  event:       { label: "אירוע",      icon: "📅", color: "#06b6d4" },
  concept:     { label: "מושג",       icon: "💡", color: "#eab308" },
  tool:        { label: "כלי",        icon: "🔧", color: "#64748b" },
  debt:        { label: "חוב",        icon: "📋", color: "#dc2626" },
  appointment: { label: "פגישה",      icon: "🗓️", color: "#7c3aed" },
  guide:       { label: "מדריך",      icon: "📖", color: "#059669" },
  contact:     { label: "איש קשר",    icon: "📞", color: "#0284c7" },
  goal:        { label: "מטרה",       icon: "🎯", color: "#be185d" },
};

const DOMAINS: Record<string, { label: string; icon: string }> = {
  health:  { label: "בריאות",    icon: "❤️" },
  money:   { label: "כסף",       icon: "💰" },
  family:  { label: "משפחה",     icon: "👨‍👩‍👧" },
  work:    { label: "עבודה",     icon: "💼" },
  admin:   { label: "בירוקרטיה", icon: "📋" },
  self:    { label: "עצמי",      icon: "🧠" },
};

export default function EntityHub() {
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>("concept");
  const [newDomain, setNewDomain] = useState("");
  const [newBody, setNewBody] = useState("");

  const { data: entities = [], refetch } = trpc.entities.list.useQuery({});
  const createMutation = trpc.entities.create.useMutation({
    onSuccess: (e) => {
      refetch();
      setShowCreate(false);
      setNewName(""); setNewBody(""); setNewDomain("");
      setLocation(`/entity/${e.id}`);
    }
  });

  // Filter
  const filtered = entities.filter(e => {
    if (filterType !== "all" && e.entityType !== filterType) return false;
    if (filterDomain !== "all" && e.domain !== filterDomain) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) &&
        !(e.tags ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by type for display
  const grouped: Record<string, typeof entities> = {};
  filtered.forEach(e => {
    if (!grouped[e.entityType]) grouped[e.entityType] = [];
    grouped[e.entityType].push(e);
  });

  return (
    <div dir="rtl" style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: '"Heebo", Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ background: "#fff", padding: "20px 16px 12px", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 14 }}>
            ← בית
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🗂️ אובייקטים</h1>
          <button
            onClick={() => setShowCreate(true)}
            style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            + חדש
          </button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש..."
          style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", direction: "rtl", fontSize: 14, background: "#f8fafc", marginBottom: 10 }}
        />

        {/* Type filter pills */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          <button
            onClick={() => setFilterType("all")}
            style={{ padding: "5px 12px", borderRadius: 20, whiteSpace: "nowrap", background: filterType === "all" ? "#6366f1" : "#f1f5f9", color: filterType === "all" ? "#fff" : "#475569", border: "none", cursor: "pointer", fontSize: 13 }}
          >
            הכל ({entities.length})
          </button>
          {Object.entries(ENTITY_TYPES).map(([k, v]) => {
            const count = entities.filter(e => e.entityType === k).length;
            if (count === 0) return null;
            return (
              <button
                key={k}
                onClick={() => setFilterType(filterType === k ? "all" : k)}
                style={{ padding: "5px 12px", borderRadius: 20, whiteSpace: "nowrap", background: filterType === k ? v.color : "#f1f5f9", color: filterType === k ? "#fff" : "#475569", border: "none", cursor: "pointer", fontSize: 13 }}
              >
                {v.icon} {v.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Domain filter */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingTop: 6 }}>
          <button
            onClick={() => setFilterDomain("all")}
            style={{ padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap", background: filterDomain === "all" ? "#1e293b" : "#f1f5f9", color: filterDomain === "all" ? "#fff" : "#475569", border: "none", cursor: "pointer", fontSize: 12 }}
          >
            כל תחומים
          </button>
          {Object.entries(DOMAINS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilterDomain(filterDomain === k ? "all" : k)}
              style={{ padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap", background: filterDomain === k ? "#1e293b" : "#f1f5f9", color: filterDomain === k ? "#fff" : "#475569", border: "none", cursor: "pointer", fontSize: 12 }}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entity list */}
      <div style={{ padding: "12px 16px 100px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗂️</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>אין אובייקטים עדיין</div>
            <div style={{ fontSize: 13 }}>לחץ "+ חדש" כדי ליצור את הראשון</div>
          </div>
        ) : filterType === "all" ? (
          // Grouped view
          Object.entries(grouped).map(([type, items]) => {
            const tc = ENTITY_TYPES[type] ?? { label: type, icon: "📌", color: "#6366f1" };
            return (
              <div key={type} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{tc.icon}</span> {tc.label}
                  <span style={{ background: "#f1f5f9", borderRadius: 10, padding: "1px 8px", fontSize: 11 }}>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map(e => <EntityCard key={e.id} entity={e} onClick={() => setLocation(`/entity/${e.id}`)} />)}
                </div>
              </div>
            );
          })
        ) : (
          // Flat view
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(e => <EntityCard key={e.id} entity={e} onClick={() => setLocation(`/entity/${e.id}`)} />)}
          </div>
        )}
      </div>

      {/* Create bottom sheet */}
      {showCreate && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }} onClick={() => setShowCreate(false)} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101, background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 16px 40px", maxHeight: "85dvh", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", direction: "rtl" }}>אובייקט חדש</h2>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>שם *</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="שם האובייקט"
                autoFocus
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", direction: "rtl", fontSize: 15 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>סוג</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(ENTITY_TYPES).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setNewType(k)}
                    style={{ padding: "6px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer", background: newType === k ? v.color : "#f1f5f9", color: newType === k ? "#fff" : "#475569", border: "none" }}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>תחום חיים</label>
              <select
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", direction: "rtl", fontSize: 14 }}
              >
                <option value="">ללא</option>
                {Object.entries(DOMAINS).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>תיאור ראשוני (Markdown)</label>
              <textarea
                value={newBody}
                onChange={e => setNewBody(e.target.value)}
                placeholder="תיאור קצר, הערות, פרטים..."
                rows={4}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", direction: "rtl", fontSize: 14, resize: "vertical", fontFamily: '"Heebo", Arial, sans-serif' }}
              />
            </div>

            <button
              onClick={() => {
                if (!newName.trim()) return;
                createMutation.mutate({ entityType: newType as any, name: newName.trim(), body: newBody, domain: newDomain });
              }}
              disabled={!newName.trim() || createMutation.isPending}
              style={{ width: "100%", padding: "14px", borderRadius: 12, background: newName.trim() ? "#6366f1" : "#e2e8f0", color: newName.trim() ? "#fff" : "#94a3b8", border: "none", fontWeight: 600, fontSize: 15, cursor: newName.trim() ? "pointer" : "default" }}
            >
              {createMutation.isPending ? "יוצר..." : "צור אובייקט"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EntityCard({ entity, onClick }: { entity: any; onClick: () => void }) {
  const tc = ENTITY_TYPES[entity.entityType] ?? { icon: "📌", color: "#6366f1", label: entity.entityType };
  const tags = entity.tags ? entity.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
  const domain = DOMAINS[entity.domain ?? ""];

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 16px", borderRadius: 14,
        background: "#fff", border: "1px solid #e2e8f0",
        cursor: "pointer", textAlign: "right", direction: "rtl",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        transition: "transform 0.1s ease",
        borderRight: `4px solid ${entity.color ?? tc.color}`,
      }}
      onPointerDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
      onPointerUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${entity.color ?? tc.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {entity.icon ?? tc.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#1e293b", marginBottom: 3 }}>{entity.name}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: tc.color, background: `${tc.color}15`, borderRadius: 10, padding: "1px 7px" }}>
            {tc.icon} {tc.label}
          </span>
          {domain && (
            <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", borderRadius: 10, padding: "1px 7px" }}>
              {domain.icon} {domain.label}
            </span>
          )}
          {tags.slice(0, 2).map((tag: string) => (
            <span key={tag} style={{ fontSize: 11, color: "#94a3b8", background: "#f8fafc", borderRadius: 10, padding: "1px 7px" }}>
              #{tag}
            </span>
          ))}
        </div>
        {entity.body && (
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
            {entity.body.replace(/[#*_\[\]]/g, "").slice(0, 60)}...
          </div>
        )}
      </div>
      <span style={{ color: "#cbd5e1", fontSize: 18, alignSelf: "center" }}>›</span>
    </button>
  );
}
