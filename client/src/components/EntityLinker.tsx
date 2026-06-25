/**
 * EntityLinker — cross-entity linking UI component.
 *
 * Shows existing links for a node and lets the user add/remove links
 * to any other entity in the system.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { TEMPLATE_MAP } from "@/lib/entityTemplates";
import { parseFrontmatter } from "@/lib/entityTemplates";
import { toast } from "sonner";

interface Relationship {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  type: string;
  label: string | null;
}

interface NodeItem {
  id: number;
  type: string;
  body: string | null;
  moduleType?: string | null;
}

function nodeTitle(node: NodeItem): string {
  const { frontmatter, body } = parseFrontmatter(node.body ?? "");
  const raw = frontmatter.title ?? body.split("\n")[0].slice(0, 50);
  return raw || `#${node.id}`;
}

function nodeIcon(node: NodeItem): string {
  const mt = node.moduleType ?? node.type;
  return TEMPLATE_MAP[mt]?.icon ?? "📄";
}

const LINK_TYPES = [
  { value: "related", label: "קשור ל" },
  { value: "blocks", label: "חוסם" },
  { value: "blocked_by", label: "חסום על ידי" },
  { value: "part_of", label: "חלק מ" },
  { value: "references", label: "מפנה ל" },
  { value: "depends_on", label: "תלוי ב" },
];

export default function EntityLinker({ nodeId }: { nodeId: number }) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [linkType, setLinkType] = useState("related");

  const { data: relationships = [], refetch } = trpc.relationships.forNode.useQuery({ nodeId });
  const { data: allNodes = [] } = trpc.nodes.list.useQuery({}, { staleTime: 30_000 });

  const createLink = trpc.relationships.create.useMutation({
    onSuccess: () => { refetch(); setShowPicker(false); setSearch(""); toast.success("קישור נוסף!"); },
    onError: () => toast.error("שגיאה בהוספת קישור"),
  });

  const deleteLink = trpc.relationships.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("קישור הוסר"); },
  });

  // Build a map of nodeId → node for quick lookup
  const nodeMap = useMemo(() => {
    const m: Record<number, NodeItem> = {};
    for (const n of allNodes as NodeItem[]) m[n.id] = n;
    return m;
  }, [allNodes]);

  // Already linked node IDs
  const linkedIds = useMemo(() => {
    const ids = new Set<number>();
    for (const r of relationships as Relationship[]) {
      if (r.fromNodeId === nodeId) ids.add(r.toNodeId);
      else ids.add(r.fromNodeId);
    }
    return ids;
  }, [relationships, nodeId]);

  // Filtered candidates for picker
  const candidates = useMemo(() => {
    const q = search.toLowerCase();
    return (allNodes as NodeItem[])
      .filter(n => n.id !== nodeId && !linkedIds.has(n.id))
      .filter(n => !q || nodeTitle(n).toLowerCase().includes(q))
      .slice(0, 20);
  }, [allNodes, nodeId, linkedIds, search]);

  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>🔗 קישורים</h3>
        <button
          onClick={() => setShowPicker(true)}
          style={{
            background: "#6366f1", color: "#fff", border: "none",
            borderRadius: 8, padding: "6px 14px", fontWeight: 600,
            fontSize: 13, cursor: "pointer",
          }}
        >
          + קשר
        </button>
      </div>

      {/* Existing links */}
      {(relationships as Relationship[]).length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>אין קישורים עדיין</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(relationships as Relationship[]).map(rel => {
            const otherId = rel.fromNodeId === nodeId ? rel.toNodeId : rel.fromNodeId;
            const other = nodeMap[otherId];
            const direction = rel.fromNodeId === nodeId ? "→" : "←";
            const typLabel = LINK_TYPES.find(l => l.value === rel.type)?.label ?? rel.type;
            return (
              <div
                key={rel.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 10,
                  background: "#f8fafc", border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 18 }}>{other ? nodeIcon(other) : "📄"}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {other ? nodeTitle(other) : `#${otherId}`}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 11 }}>
                      {direction} {typLabel}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteLink.mutate({ id: rel.id })}
                  style={{ background: "none", border: "none", color: "#ef4444", fontSize: 18, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Picker bottom sheet */}
      {showPicker && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }}
            onClick={() => setShowPicker(false)}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
            background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "20px 16px 40px", maxHeight: "80dvh",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 16px" }} />
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, direction: "rtl" }}>קשר לישות אחרת</h3>

            {/* Link type selector */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
              {LINK_TYPES.map(lt => (
                <button
                  key={lt.value}
                  onClick={() => setLinkType(lt.value)}
                  style={{
                    padding: "6px 12px", borderRadius: 20, border: "none",
                    background: linkType === lt.value ? "#6366f1" : "#f1f5f9",
                    color: linkType === lt.value ? "#fff" : "#64748b",
                    fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  {lt.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חפש ישות..."
              autoFocus
              style={{
                padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                fontSize: 15, marginBottom: 12, direction: "rtl", outline: "none",
              }}
            />

            {/* Candidates */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {candidates.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center", padding: 20 }}>לא נמצאו ישויות</p>
              ) : (
                candidates.map(node => (
                  <button
                    key={node.id}
                    onClick={() => createLink.mutate({ fromNodeId: nodeId, toNodeId: node.id, type: linkType })}
                    disabled={createLink.isPending}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 12,
                      background: "#f8fafc", border: "1px solid #e2e8f0",
                      cursor: "pointer", direction: "rtl", textAlign: "right",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{nodeIcon(node)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {nodeTitle(node)}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: 11 }}>
                        {TEMPLATE_MAP[node.moduleType ?? node.type]?.labelHe ?? node.type}
                      </div>
                    </div>
                    <span style={{ color: "#6366f1", fontWeight: 700, fontSize: 18 }}>+</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
