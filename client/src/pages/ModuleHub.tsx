import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ENTITY_TEMPLATES, type EntityTemplate } from "@/lib/entityTemplates";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

// Default visible modules (ordered as in the screenshot)
const DEFAULT_MODULES = ["list", "finance", "project", "note", "task", "file", "bookmark", "contact"];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "בוקר טוב";
  if (h < 17) return "צהריים טובים";
  if (h < 21) return "ערב טוב";
  return "לילה טוב";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
}

export default function ModuleHub() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [browseOpen, setBrowseOpen] = useState(false);
  const [visibleModules, setVisibleModules] = useState<string[]>(DEFAULT_MODULES);

  const orderedTemplates = visibleModules
    .map(m => ENTITY_TEMPLATES.find(t => t.moduleType === m))
    .filter(Boolean) as EntityTemplate[];

  const allTemplates = ENTITY_TEMPLATES;

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, background: "#f8fafc" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>ZenCanvas</h1>
        <p style={{ color: "#64748b", marginBottom: 32, textAlign: "center" }}>ארגן את החיים שלך במקום אחד</p>
        <a href={getLoginUrl()} style={{ background: "#6366f1", color: "#fff", padding: "14px 32px", borderRadius: 12, textDecoration: "none", fontWeight: 600, fontSize: 16 }}>
          התחבר
        </a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 8px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, direction: "rtl" }}>
            {greeting()}, {user?.name?.split(" ")[0] ?? ""}
          </h1>
          <p style={{ color: "#94a3b8", margin: "4px 0 0", fontSize: 14, direction: "rtl" }}>{todayLabel()}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setLocation("/canvas")}
            style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}
            title="קאנבס"
          >
            🗺️
          </button>
          <button
            onClick={() => setLocation("/inbox")}
            style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}
            title="תיבת דואר"
          >
            🔔
          </button>
          <button
            onClick={() => setLocation("/profile")}
            style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}
            title="פרופיל"
          >
            👤
          </button>
        </div>
      </div>

      {/* Quick Access: Daily Tracker + App Map */}
      <div style={{ padding: "8px 16px 4px", display: "flex", gap: 10 }}>
        <button
          onClick={() => setLocation("/tracker")}
          style={{
            flex: 1, padding: "14px 12px", borderRadius: 14,
            background: "linear-gradient(135deg, #fdf2f8, #fce7f3)",
            border: "1.5px solid #f9a8d4",
            cursor: "pointer", textAlign: "right", direction: "rtl",
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <div style={{ fontSize: 28 }}>📋</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#be185d" }}>יומן יומי</div>
            <div style={{ fontSize: 11, color: "#9d174d" }}>רני · פיצ' · בריאות · כסף</div>
          </div>
        </button>
        <button
          onClick={() => setLocation("/appmap")}
          style={{
            flex: 1, padding: "14px 12px", borderRadius: 14,
            background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
            border: "1.5px solid #a5b4fc",
            cursor: "pointer", textAlign: "right", direction: "rtl",
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <div style={{ fontSize: 28 }}>🗺️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#4338ca" }}>מפת כלים</div>
            <div style={{ fontSize: 11, color: "#3730a3" }}>השוואת אפליקציות</div>
          </div>
        </button>
      </div>

      {/* Module list */}
      <div style={{ flex: 1, padding: "12px 16px 100px", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orderedTemplates.map(template => (
            <ModuleCard
              key={template.moduleType}
              template={template}
              onClick={() => setLocation(`/module/${template.moduleType}`)}
            />
          ))}
        </div>
      </div>

      {/* Browse Modules button */}
      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50 }}>
        <button
          onClick={() => setBrowseOpen(true)}
          style={{
            background: "#1e293b",
            color: "#fff",
            border: "none",
            borderRadius: 28,
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 32px rgba(30,41,59,0.25)",
            direction: "rtl",
          }}
        >
          <span style={{ fontSize: 18 }}>+</span>
          עיין במודולים
        </button>
      </div>

      {/* Browse Modules bottom sheet */}
      {browseOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }}
            onClick={() => setBrowseOpen(false)}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
            background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "20px 16px 40px",
            maxHeight: "80dvh", overflowY: "auto",
          }}>
            <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", direction: "rtl" }}>כל המודולים</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allTemplates.map(template => {
                const active = visibleModules.includes(template.moduleType);
                return (
                  <div
                    key={template.moduleType}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 16px", borderRadius: 14,
                      background: active ? "#f0fdf4" : "#f8fafc",
                      border: `1.5px solid ${active ? "#86efac" : "#e2e8f0"}`,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setVisibleModules(prev =>
                        prev.includes(template.moduleType)
                          ? prev.filter(m => m !== template.moduleType)
                          : [...prev, template.moduleType]
                      );
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, direction: "rtl" }}>
                      <span style={{ fontSize: 26 }}>{template.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{template.labelHe}</div>
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>{template.descriptionHe}</div>
                      </div>
                    </div>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: active ? "#22c55e" : "#e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 14, fontWeight: 700,
                    }}>
                      {active ? "✓" : "+"}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setBrowseOpen(false)}
              style={{ width: "100%", marginTop: 20, padding: "14px", borderRadius: 12, background: "#6366f1", color: "#fff", border: "none", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
            >
              סגור
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ModuleCard({ template, onClick }: { template: EntityTemplate; onClick: () => void }) {
  const { data: countData } = trpc.nodes.list.useQuery(
    { type: template.moduleType },
    { staleTime: 30_000 }
  );
  const count = Array.isArray(countData) ? countData.length : 0;

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 20px",
        borderRadius: 16,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        cursor: "pointer",
        textAlign: "right",
        direction: "rtl",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        transition: "transform 0.1s ease, box-shadow 0.1s ease",
      }}
      onPointerDown={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)";
      }}
      onPointerUp={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${template.accentColor}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          {template.icon}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, color: "#1e293b" }}>{template.labelHe}</div>
          {count > 0 && (
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{count} פריטים</div>
          )}
        </div>
      </div>
      <span style={{ color: "#cbd5e1", fontSize: 20 }}>›</span>
    </button>
  );
}
