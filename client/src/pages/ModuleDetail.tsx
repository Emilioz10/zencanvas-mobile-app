import { useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  TEMPLATE_MAP,
  type EntityTemplate,
  type TemplateField,
  buildFrontmatter,
  parseFrontmatter,
} from "@/lib/entityTemplates";
import EntityLinker from "@/components/EntityLinker";
import { toast } from "sonner";

// ─── EntityForm ──────────────────────────────────────────────────────────────

function EntityForm({
  template,
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  template: EntityTemplate;
  initial?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>(initial ?? {});

  const set = (key: string, val: string) => setValues(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {template.fields.map(field => (
        <FieldInput key={field.key} field={field} value={values[field.key] ?? ""} onChange={val => set(field.key, val)} />
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1, padding: "14px", borderRadius: 12,
            background: template.accentColor, color: "#fff",
            border: "none", fontWeight: 600, fontSize: 15, cursor: "pointer",
          }}
        >
          {loading ? "שומר..." : "שמור"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, padding: "14px", borderRadius: 12,
            background: "#f1f5f9", color: "#64748b",
            border: "none", fontWeight: 600, fontSize: 15, cursor: "pointer",
          }}
        >
          ביטול
        </button>
      </div>
    </form>
  );
}

function FieldInput({ field, value, onChange }: { field: TemplateField; value: string; onChange: (v: string) => void }) {
  const isHe = /[\u0590-\u05FF]/.test(value);
  const dir = isHe ? "rtl" : "ltr";
  const label = field.labelHe;
  const baseStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1.5px solid #e2e8f0", fontSize: 15, background: "#fff",
    direction: dir, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontWeight: 600, fontSize: 13, color: "#475569", direction: "rtl" }}>
        {label}{field.required && " *"}
      </label>
      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          style={{ ...baseStyle, resize: "vertical" }}
        />
      ) : field.type === "select" ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={baseStyle}>
          <option value="">בחר...</option>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : field.type === "checkbox" ? (
        <label style={{ display: "flex", alignItems: "center", gap: 10, direction: "rtl" }}>
          <input type="checkbox" checked={value === "true"} onChange={e => onChange(e.target.checked ? "true" : "false")} style={{ width: 20, height: 20 }} />
          <span>{label}</span>
        </label>
      ) : (
        <input
          type={field.type === "email" ? "email" : field.type === "url" ? "url" : field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "phone" ? "tel" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={baseStyle}
        />
      )}
    </div>
  );
}

// ─── EntityCard ──────────────────────────────────────────────────────────────

function EntityCard({
  node,
  template,
  onTap,
}: {
  node: { id: number; body: string | null; tags: string | null; status: string | null; createdAt: Date };
  template: EntityTemplate;
  onTap: () => void;
}) {
  const { frontmatter, body } = parseFrontmatter(node.body ?? "");
  const rawTitle = frontmatter.title ?? body.split("\n")[0].slice(0, 60);
  const title = rawTitle || "ללא כותרת";
  const subtitle = Object.entries(frontmatter)
    .filter(([k]) => k !== "title")
    .slice(0, 2)
    .map(([k, v]) => `${v}`)
    .join(" · ");

  return (
    <button
      onClick={onTap}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 18px", borderRadius: 14,
        background: "#fff", border: "1px solid #e2e8f0",
        cursor: "pointer", textAlign: "right", direction: "rtl",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        width: "100%",
      }}
      onPointerDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
      onPointerUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 3 }}>{subtitle}</div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 12, flexShrink: 0 }}>
        {node.status && node.status !== "inbox" && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 8,
            background: `${template.accentColor}18`, color: template.accentColor,
          }}>
            {node.status}
          </span>
        )}
        <span style={{ color: "#cbd5e1", fontSize: 18 }}>›</span>
      </div>
    </button>
  );
}

// ─── ModuleDetail page ────────────────────────────────────────────────────────

export default function ModuleDetail() {
  const params = useParams<{ moduleType: string }>();
  const moduleType = params.moduleType ?? "";
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const template = TEMPLATE_MAP[moduleType];

  const [showCreate, setShowCreate] = useState(false);
  const [editNodeId, setEditNodeId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data: nodes = [], refetch } = trpc.nodes.list.useQuery(
    { type: moduleType },
    { enabled: isAuthenticated && !!moduleType }
  );

  const createNode = trpc.nodes.create.useMutation({
    onSuccess: () => { refetch(); setShowCreate(false); toast.success("נשמר!"); },
    onError: () => toast.error("שגיאה בשמירה"),
  });

  const updateNode = trpc.nodes.update.useMutation({
    onSuccess: () => { refetch(); setEditNodeId(null); toast.success("עודכן!"); },
    onError: () => toast.error("שגיאה בעדכון"),
  });

  const deleteNode = trpc.nodes.delete.useMutation({
    onSuccess: () => { refetch(); setEditNodeId(null); toast.success("נמחק"); },
  });

  const handleCreate = useCallback((values: Record<string, string>) => {
    if (!template) return;
    const fm = buildFrontmatter(template, values);
    const bodyContent = values.body ?? "";
    const fullBody = bodyContent ? `${fm}\n${bodyContent}` : fm;
    createNode.mutate({
      type: moduleType,
      moduleType,
      body: fullBody,
      tags: values.tags ?? "",
      status: values.status ?? "inbox",
    });
  }, [template, moduleType, createNode]);

  const handleUpdate = useCallback((values: Record<string, string>) => {
    if (!template || editNodeId === null) return;
    const fm = buildFrontmatter(template, values);
    const bodyContent = values.body ?? "";
    const fullBody = bodyContent ? `${fm}\n${bodyContent}` : fm;
    updateNode.mutate({
      id: editNodeId,
      body: fullBody,
      tags: values.tags ?? "",
      status: values.status ?? "inbox",
    });
  }, [template, editNodeId, updateNode]);

  if (!template) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <p>מודול לא נמצא</p>
        <button onClick={() => setLocation("/")}>חזור</button>
      </div>
    );
  }

  const filteredNodes = filterStatus
    ? nodes.filter((n: { status: string | null }) => (n.status ?? "") === filterStatus)
    : nodes;

  const editNode = editNodeId !== null ? nodes.find((n: { id: number }) => n.id === editNodeId) : null;
  const editInitial = editNode
    ? (() => {
        const { frontmatter, body } = parseFrontmatter((editNode.body as string | null) ?? "");
        return { ...frontmatter, body };
      })()
    : undefined;

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        direction: "rtl",
      }}>
        <button
          onClick={() => setLocation("/")}
          style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#64748b", padding: 4 }}
        >
          ‹
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>{template.icon}</span>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{template.labelHe}</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            background: template.accentColor, color: "#fff",
            border: "none", borderRadius: 10, padding: "8px 16px",
            fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          + חדש
        </button>
      </div>

      {/* Filter bar (for types with status) */}
      {template.fields.some(f => f.key === "status") && (
        <div style={{ padding: "10px 16px", display: "flex", gap: 8, overflowX: "auto", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
          {["", ...(template.fields.find(f => f.key === "status")?.options ?? [])].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "none",
                background: filterStatus === s ? template.accentColor : "#f1f5f9",
                color: filterStatus === s ? "#fff" : "#64748b",
                fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {s || "הכל"}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, padding: "12px 16px 100px", overflowY: "auto" }}>
        {filteredNodes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{template.icon}</div>
            <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>אין {template.labelHe} עדיין</p>
            <p style={{ fontSize: 14, margin: 0 }}>לחץ "+ חדש" כדי להוסיף</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredNodes.map((node: { id: number; body: string | null; tags: string | null; status: string | null; createdAt: Date }) => (
              <EntityCard
                key={node.id}
                node={node}
                template={template}
                onTap={() => setEditNodeId(node.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        style={{
          position: "fixed", bottom: 24, right: 20, width: 56, height: 56,
          borderRadius: "50%", background: template.accentColor,
          border: "none", color: "#fff", fontSize: 28, fontWeight: 300,
          cursor: "pointer", boxShadow: `0 6px 24px ${template.accentColor}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50,
        }}
      >
        +
      </button>

      {/* Create bottom sheet */}
      {showCreate && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }} onClick={() => setShowCreate(false)} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
            background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "20px 20px 40px", maxHeight: "90dvh", overflowY: "auto",
          }}>
            <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px", direction: "rtl" }}>
              {template.icon} {template.labelHe} חדש
            </h2>
            <EntityForm
              template={template}
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              loading={createNode.isPending}
            />
          </div>
        </>
      )}

      {/* Edit bottom sheet */}
      {editNodeId !== null && editNode && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }} onClick={() => setEditNodeId(null)} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
            background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "20px 20px 40px", maxHeight: "90dvh", overflowY: "auto",
          }}>
            <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, direction: "rtl" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>עריכה</h2>
              <button
                onClick={() => { if (confirm("למחוק?")) deleteNode.mutate({ id: editNodeId }); }}
                style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 600, cursor: "pointer" }}
              >
                מחק
              </button>
            </div>
            <EntityForm
              template={template}
              initial={editInitial}
              onSubmit={handleUpdate}
              onCancel={() => setEditNodeId(null)}
              loading={updateNode.isPending}
            />
            {/* Cross-entity linking */}
            <div style={{ marginTop: 20, padding: "16px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <EntityLinker nodeId={editNodeId} />
            </div>
            {/* Link to canvas */}
            <button
              onClick={() => setLocation(`/canvas?highlight=${editNodeId}`)}
              style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 12, background: "#f8fafc", color: "#6366f1", border: "1.5px solid #e0e7ff", fontWeight: 600, fontSize: 14, cursor: "pointer", direction: "rtl" }}
            >
              🗺️ הצג בקאנבס
            </button>
          </div>
        </>
      )}
    </div>
  );
}
