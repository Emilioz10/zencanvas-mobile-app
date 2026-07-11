/**
 * KnowledgeEditor — עורך הידע העברי
 *
 * Capacities + Obsidian בעברית:
 * - עורך Markdown עברי עם תצוגה מקדימה חיה
 * - Mermaid מרונדר בתוך הדף
 * - Wikilinks [[שם]] → קישורים לאובייקטים קיימים
 * - בחירת סוג אובייקט בעברית
 * - שמירה אוטומטית לDB
 * - עוזר AI לעברית
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import HebMd from "@/components/HebMd";

// ─── Hebrew object types ─────────────────────────────────────────────────────

const HEB_TYPES: { value: string; label: string; icon: string; color: string }[] = [
  { value: "concept",     label: "מושג",       icon: "💡", color: "#6366f1" },
  { value: "document",    label: "מסמך",        icon: "📄", color: "#0ea5e9" },
  { value: "person",      label: "אדם",         icon: "👤", color: "#f59e0b" },
  { value: "place",       label: "מקום",        icon: "📍", color: "#10b981" },
  { value: "event",       label: "אירוע",       icon: "📅", color: "#8b5cf6" },
  { value: "process",     label: "תהליך",       icon: "🔄", color: "#06b6d4" },
  { value: "protocol",    label: "פרוטוקול",    icon: "📋", color: "#64748b" },
  { value: "medication",  label: "תרופה",       icon: "💊", color: "#ef4444" },
  { value: "money",       label: "כסף",         icon: "💰", color: "#16a34a" },
  { value: "tool",        label: "כלי",         icon: "🔧", color: "#78716c" },
  { value: "guide",       label: "מדריך",       icon: "📖", color: "#d97706" },
  { value: "goal",        label: "מטרה",        icon: "🎯", color: "#e11d48" },
];

const DOMAIN_OPTIONS = [
  { value: "health",  label: "בריאות",   icon: "🏥" },
  { value: "money",   label: "כספים",    icon: "💰" },
  { value: "family",  label: "משפחה",    icon: "👨‍👩‍👧" },
  { value: "admin",   label: "בירוקרטיה", icon: "🏛️" },
  { value: "self",    label: "עצמי",     icon: "🧠" },
  { value: "work",    label: "עבודה",    icon: "💼" },
  { value: "home",    label: "בית",      icon: "🏠" },
  { value: "spirit",  label: "רוחני",    icon: "✡️" },
];

const LINK_TYPES = [
  { value: "related",    label: "קשור ל" },
  { value: "part_of",    label: "חלק מ" },
  { value: "references", label: "מפנה ל" },
  { value: "depends_on", label: "תלוי ב" },
  { value: "blocks",     label: "חוסם" },
  { value: "caused_by",  label: "נגרם על ידי" },
  { value: "resolves",   label: "פותר" },
  { value: "owns",       label: "שייך ל" },
];

// ─── Wikilink autocomplete ────────────────────────────────────────────────────

function WikilinkPopup({
  query,
  entities,
  onSelect,
  onClose,
}: {
  query: string;
  entities: { id: number; name: string; entityType: string }[];
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const filtered = entities.filter(e =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    e.name.includes(query)
  ).slice(0, 8);

  if (!filtered.length) return null;

  return (
    <div style={{
      position: "absolute", zIndex: 1000, background: "#fff",
      border: "1.5px solid #6366f1", borderRadius: 12,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      minWidth: 220, maxHeight: 280, overflowY: "auto",
      direction: "rtl",
    }}>
      {filtered.map(e => {
        const t = HEB_TYPES.find(x => x.value === e.entityType);
        return (
          <button
            key={e.id}
            onClick={() => onSelect(e.name)}
            style={{
              width: "100%", padding: "10px 14px",
              background: "none", border: "none",
              display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer", textAlign: "right",
            }}
            onMouseEnter={e2 => (e2.currentTarget.style.background = "#f5f3ff")}
            onMouseLeave={e2 => (e2.currentTarget.style.background = "none")}
          >
            <span style={{ fontSize: 18 }}>{t?.icon ?? "📌"}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{e.name}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{t?.label ?? e.entityType}</span>
          </button>
        );
      })}
      <button
        onClick={onClose}
        style={{
          width: "100%", padding: "8px 14px",
          background: "#f8fafc", border: "none", borderTop: "1px solid #e2e8f0",
          fontSize: 12, color: "#94a3b8", cursor: "pointer",
        }}
      >
        סגור
      </button>
    </div>
  );
}

// ─── AI panel ────────────────────────────────────────────────────────────────

function AiPanel({
  body,
  onApply,
  onClose,
}: {
  body: string;
  onApply: (text: string) => void;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const rewrite = trpc.knowledge.aiRewrite.useMutation({
    onSuccess: (data) => { setResult(String((data as { text: unknown }).text ?? "")); setLoading(false); },
    onError: () => { toast.error("שגיאה ב-AI"); setLoading(false); },
  });

  const quick = (instruction: string) => {
    setLoading(true);
    rewrite.mutate({ body, instruction });
  };

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: "#fff", borderTop: "2px solid #6366f1",
      borderRadius: "16px 16px 0 0",
      padding: "16px 16px 32px",
      boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
      direction: "rtl",
      maxHeight: "70dvh", overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🤖 עוזר עברית</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>✕</button>
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          { label: "שכתב בעברית ברורה", instruction: "שכתב את הטקסט בעברית ברורה ופשוטה, שמור על המשמעות" },
          { label: "קצר ל-3 נקודות", instruction: "סכם את הטקסט ל-3 נקודות עיקריות בעברית" },
          { label: "הוסף כותרות", instruction: "הוסף כותרות Markdown לפי הנושאים בטקסט" },
          { label: "הפוך לרשימה", instruction: "הפוך את הטקסט לרשימת נקודות מסודרת בעברית" },
          { label: "נקה שגיאות כתיב", instruction: "תקן שגיאות כתיב ודקדוק בעברית, אל תשנה תוכן" },
        ].map(a => (
          <button
            key={a.label}
            onClick={() => quick(a.instruction)}
            disabled={loading || !body.trim()}
            style={{
              padding: "8px 14px", borderRadius: 20,
              background: "#f5f3ff", border: "1.5px solid #c4b5fd",
              color: "#6366f1", fontWeight: 600, fontSize: 13,
              cursor: "pointer",
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Custom prompt */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="הוראה מותאמת אישית..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 12,
            border: "1.5px solid #e2e8f0", fontSize: 14, direction: "rtl",
            outline: "none",
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && prompt.trim()) {
              setLoading(true);
              rewrite.mutate({ body, instruction: prompt });
            }
          }}
        />
        <button
          onClick={() => { setLoading(true); rewrite.mutate({ body, instruction: prompt }); }}
          disabled={loading || !prompt.trim()}
          style={{
            padding: "10px 18px", background: "#6366f1", color: "#fff",
            border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          {loading ? "⏳" : "שלח"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{ background: "#f5f3ff", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 13, color: "#6366f1", fontWeight: 700, marginBottom: 8 }}>תוצאה:</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#1e293b" }}>{result}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => { onApply(result); onClose(); }}
              style={{
                flex: 1, padding: "10px", background: "#6366f1", color: "#fff",
                border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer",
              }}
            >
              ✓ החלף תוכן
            </button>
            <button
              onClick={() => { onApply(body + "\n\n---\n\n" + result); onClose(); }}
              style={{
                flex: 1, padding: "10px", background: "#fff", color: "#6366f1",
                border: "1.5px solid #6366f1", borderRadius: 10, fontWeight: 700, cursor: "pointer",
              }}
            >
              + הוסף בסוף
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function KnowledgeEditor() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/knowledge/:id");
  const entityId = params?.id ? parseInt(params.id) : null;
  const { isAuthenticated } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("concept");
  const [domain, setDomain] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Wikilink autocomplete
  const [wikiQuery, setWikiQuery] = useState("");
  const [wikiPos, setWikiPos] = useState<{ top: number; left: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing entity
  const { data: entity } = trpc.entities.get.useQuery(
    { id: entityId! },
    { enabled: !!entityId && isAuthenticated }
  );

  // Load all entities for wikilink autocomplete
  const { data: allEntities = [] } = trpc.entities.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Save mutation
  const createEntity = trpc.entities.create.useMutation({
    onSuccess: (data) => {
      toast.success("נשמר");
      setDirty(false);
      if (!entityId) setLocation(`/knowledge/${data.id}`);
    },
    onError: () => toast.error("שגיאה בשמירה"),
  });

  const updateEntity = trpc.entities.update.useMutation({
    onSuccess: () => { toast.success("עודכן"); setDirty(false); },
    onError: () => toast.error("שגיאה בעדכון"),
  });

  // Populate form when entity loads
  useEffect(() => {
    if (entity?.entity) {
      setName(entity.entity.name);
      setEntityType(entity.entity.entityType);
      setDomain(entity.entity.domain ?? "");
      setBody(entity.entity.body ?? "");
      setTags(entity.entity.tags ?? "");
    }
  }, [entity]);

  // Auto-save after 2s of inactivity
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSave = useCallback(() => {
    if (!name.trim() || !isAuthenticated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (entityId) {
        updateEntity.mutate({ id: entityId, name, domain, body, tags });
      }
    }, 2000);
  }, [name, entityType, domain, body, tags, entityId, isAuthenticated, updateEntity]);

  useEffect(() => {
    if (dirty) autoSave();
  }, [dirty, autoSave]);

  // Wikilink detection in textarea
  function handleBodyChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setBody(val);
    setDirty(true);

    // Detect [[... pattern
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const match = before.match(/\[\[([^\]]*?)$/);
    if (match) {
      setWikiQuery(match[1]);
      // Position popup near cursor
      const rect = e.target.getBoundingClientRect();
      setWikiPos({ top: rect.bottom + 4, left: rect.left + 8 });
    } else {
      setWikiQuery("");
      setWikiPos(null);
    }
  }

  function insertWikilink(selectedName: string) {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const cursor = ta.selectionStart;
    const before = body.slice(0, cursor);
    const after = body.slice(cursor);
    // Replace the [[partial with [[full]]
    const newBefore = before.replace(/\[\[([^\]]*)$/, `[[${selectedName}]]`);
    const newBody = newBefore + after;
    setBody(newBody);
    setWikiQuery("");
    setWikiPos(null);
    setDirty(true);
    // Restore focus
    setTimeout(() => {
      ta.focus();
      const newPos = newBefore.length;
      ta.setSelectionRange(newPos, newPos);
    }, 10);
  }

  function save() {
    if (!name.trim()) { toast.error("חסר שם"); return; }
    if (entityId) {
      updateEntity.mutate({ id: entityId, name, domain, body, tags });
    } else {
      const validType = entityType as "person" | "document" | "task" | "project" | "medication" | "money" | "place" | "event" | "concept" | "tool" | "debt" | "appointment" | "guide" | "contact" | "goal";
      createEntity.mutate({ name, entityType: validType, domain, body, tags });
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ direction: "rtl" }}>יש להתחבר</p>
      </div>
    );
  }

  const typeConfig = HEB_TYPES.find(t => t.value === entityType) ?? HEB_TYPES[0];

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", direction: "rtl", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "12px 16px", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <button
          onClick={() => setLocation("/knowledge")}
          style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 4 }}
        >
          ←
        </button>

        {/* Name input */}
        <input
          value={name}
          onChange={e => { setName(e.target.value); setDirty(true); }}
          placeholder="שם האובייקט..."
          style={{
            flex: 1, border: "none", outline: "none",
            fontSize: 18, fontWeight: 700, color: "#1e293b",
            background: "transparent", direction: "rtl",
          }}
        />

        {/* Type badge */}
        <div style={{
          padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
          background: typeConfig.color + "18", color: typeConfig.color,
          border: `1.5px solid ${typeConfig.color}40`,
          flexShrink: 0,
        }}>
          {typeConfig.icon} {typeConfig.label}
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={createEntity.isPending || updateEntity.isPending}
          style={{
            padding: "8px 16px", background: dirty ? "#6366f1" : "#e2e8f0",
            color: dirty ? "#fff" : "#94a3b8",
            border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13,
            cursor: "pointer", flexShrink: 0,
          }}
        >
          {createEntity.isPending || updateEntity.isPending ? "⏳" : "שמור"}
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "8px 16px", display: "flex", gap: 8, overflowX: "auto",
        flexShrink: 0,
      }}>
        {/* Type selector */}
        <select
          value={entityType}
          onChange={e => { setEntityType(e.target.value); setDirty(true); }}
          style={{
            padding: "6px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0",
            fontSize: 13, direction: "rtl", background: "#fff", cursor: "pointer",
          }}
        >
          {HEB_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
          ))}
        </select>

        {/* Domain selector */}
        <select
          value={domain}
          onChange={e => { setDomain(e.target.value); setDirty(true); }}
          style={{
            padding: "6px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0",
            fontSize: 13, direction: "rtl", background: "#fff", cursor: "pointer",
          }}
        >
          <option value="">תחום...</option>
          {DOMAIN_OPTIONS.map(d => (
            <option key={d.value} value={d.value}>{d.icon} {d.label}</option>
          ))}
        </select>

        {/* Preview toggle */}
        <button
          onClick={() => setShowPreview(v => !v)}
          style={{
            padding: "6px 14px", borderRadius: 8,
            background: showPreview ? "#6366f1" : "#f5f3ff",
            color: showPreview ? "#fff" : "#6366f1",
            border: "1.5px solid #c4b5fd", fontSize: 13, fontWeight: 600,
            cursor: "pointer", flexShrink: 0,
          }}
        >
          {showPreview ? "✏️ עריכה" : "👁️ תצוגה"}
        </button>

        {/* AI button */}
        <button
          onClick={() => setShowAi(v => !v)}
          style={{
            padding: "6px 14px", borderRadius: 8,
            background: showAi ? "#7c3aed" : "#faf5ff",
            color: showAi ? "#fff" : "#7c3aed",
            border: "1.5px solid #c4b5fd", fontSize: 13, fontWeight: 600,
            cursor: "pointer", flexShrink: 0,
          }}
        >
          🤖 AI
        </button>

        {/* Links button */}
        <button
          onClick={() => setShowLinkPanel(v => !v)}
          style={{
            padding: "6px 14px", borderRadius: 8,
            background: showLinkPanel ? "#0ea5e9" : "#f0f9ff",
            color: showLinkPanel ? "#fff" : "#0ea5e9",
            border: "1.5px solid #7dd3fc", fontSize: 13, fontWeight: 600,
            cursor: "pointer", flexShrink: 0,
          }}
        >
          🔗 קישורים
        </button>
      </div>

      {/* ── Body area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {showPreview ? (
          /* Preview mode */
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 100px" }}>
            {body.trim() ? (
              <HebMd>{body}</HebMd>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 15, textAlign: "center", marginTop: 60 }}>
                אין תוכן עדיין — עבור למצב עריכה
              </div>
            )}
          </div>
        ) : (
          /* Edit mode */
          <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={handleBodyChange}
              placeholder={`כתוב כאן בעברית...

# כותרת ראשית
## כותרת משנה

[[קישור לאובייקט]]

\`\`\`mermaid
graph TD
  א --> ב
  ב --> ג
\`\`\``}
              style={{
                flex: 1, width: "100%", minHeight: "60dvh",
                padding: "20px 20px 100px",
                border: "none", outline: "none", resize: "none",
                fontSize: 15, lineHeight: 1.8, direction: "rtl",
                fontFamily: '"Heebo", "Arial Hebrew", Arial, sans-serif',
                background: "#fafafa", color: "#1e293b",
              }}
            />

            {/* Wikilink popup */}
            {wikiPos && wikiQuery !== undefined && (
              <div style={{ position: "fixed", top: wikiPos.top, left: wikiPos.left, zIndex: 1000 }}>
                <WikilinkPopup
                  query={wikiQuery}
                  entities={allEntities}
                  onSelect={insertWikilink}
                  onClose={() => { setWikiQuery(""); setWikiPos(null); }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Tags row ── */}
      <div style={{
        background: "#fff", borderTop: "1px solid #e2e8f0",
        padding: "10px 16px", flexShrink: 0,
      }}>
        <input
          value={tags}
          onChange={e => { setTags(e.target.value); setDirty(true); }}
          placeholder="תגיות (מופרדות בפסיק)..."
          style={{
            width: "100%", border: "none", outline: "none",
            fontSize: 13, color: "#64748b", direction: "rtl",
            background: "transparent",
          }}
        />
      </div>

      {/* ── Links panel ── */}
      {showLinkPanel && entityId && (
        <LinkPanel
          entityId={entityId}
          allEntities={allEntities}
          linkedEntities={(entity?.outgoing ?? []) as { toEntityId: number; linkType: string }[]}
          onClose={() => setShowLinkPanel(false)}
        />
      )}

      {/* ── AI panel ── */}
      {showAi && (
        <AiPanel
          body={body}
          onApply={text => { setBody(text); setDirty(true); }}
          onClose={() => setShowAi(false)}
        />
      )}
    </div>
  );
}

// ─── Link panel ───────────────────────────────────────────────────────────────

function LinkPanel({
  entityId,
  allEntities,
  linkedEntities,
  onClose,
}: {
  entityId: number;
  allEntities: { id: number; name: string; entityType: string }[];
  linkedEntities: { toEntityId: number; linkType: string }[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [linkType, setLinkType] = useState("related");
  const utils = trpc.useUtils();

  const linkMutation = trpc.entities.link.useMutation({
    onSuccess: () => { toast.success("קישור נוסף"); utils.entities.get.invalidate({ id: entityId }); },
    onError: () => toast.error("שגיאה בקישור"),
  });

  const unlinkMutation = trpc.entities.unlink.useMutation({
    onSuccess: () => { toast.success("קישור הוסר"); utils.entities.get.invalidate({ id: entityId }); },
    onError: () => toast.error("שגיאה בהסרה"),
  });

  const linkedIds = new Set(linkedEntities.map(l => l.toEntityId));
  const filtered = allEntities
    .filter(e => e.id !== entityId && (search === "" || e.name.includes(search)))
    .slice(0, 12);

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: "#fff", borderTop: "2px solid #0ea5e9",
      borderRadius: "16px 16px 0 0",
      padding: "16px 16px 32px",
      boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
      direction: "rtl",
      maxHeight: "60dvh", overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🔗 ניהול קישורים</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש אובייקט לקישור..."
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 10,
            border: "1.5px solid #e2e8f0", fontSize: 14, direction: "rtl", outline: "none",
          }}
        />
        <select
          value={linkType}
          onChange={e => setLinkType(e.target.value)}
          style={{
            padding: "8px 10px", borderRadius: 10, border: "1.5px solid #e2e8f0",
            fontSize: 13, direction: "rtl",
          }}
        >
          {LINK_TYPES.map(lt => (
            <option key={lt.value} value={lt.value}>{lt.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(e => {
          const isLinked = linkedIds.has(e.id);
          const t = HEB_TYPES.find(x => x.value === e.entityType);
          return (
            <div
              key={e.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                background: isLinked ? "#f0f9ff" : "#f8fafc",
                border: `1px solid ${isLinked ? "#7dd3fc" : "#e2e8f0"}`,
              }}
            >
              <span style={{ fontSize: 18 }}>{t?.icon ?? "📌"}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{e.name}</span>
              <button
                onClick={() => {
                  if (isLinked) {
                    // Find the link id to unlink
                    const link = linkedEntities.find(l => l.toEntityId === e.id);
                    if (link && 'id' in link) unlinkMutation.mutate({ linkId: (link as any).id });
                  } else {
                    const validLinkType = linkType as "related" | "depends_on" | "blocks" | "part_of" | "references" | "caused_by" | "resolves" | "owns";
                    linkMutation.mutate({ fromEntityId: entityId, toEntityId: e.id, linkType: validLinkType });
                  }
                }}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: isLinked ? "#fef2f2" : "#0ea5e9",
                  color: isLinked ? "#dc2626" : "#fff",
                  border: "none", cursor: "pointer",
                }}
              >
                {isLinked ? "הסר" : "קשר"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
