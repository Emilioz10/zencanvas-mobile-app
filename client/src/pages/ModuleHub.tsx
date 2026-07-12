import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function ModuleHub() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 32, background: "#0f172a",
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🧠</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: "#f1f5f9" }}>מרכז הידע</h1>
        <p style={{ color: "#64748b", marginBottom: 32, textAlign: "center", fontSize: 14 }}>
          Obsidian + Capacities בעברית
        </p>
        <a
          href={getLoginUrl()}
          style={{
            background: "#6366f1", color: "#fff",
            padding: "14px 32px", borderRadius: 12,
            textDecoration: "none", fontWeight: 700, fontSize: 16,
          }}
        >
          התחבר
        </a>
      </div>
    );
  }

  const name = user?.name?.split(" ")[0] ?? "";

  return (
    <div style={{
      minHeight: "100dvh", background: "#0f172a",
      display: "flex", flexDirection: "column",
      direction: "rtl", padding: "32px 20px 40px",
      gap: 12,
    }}>

      {/* Greeting */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
          {new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        {name && (
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>
            שלום, {name}
          </div>
        )}
      </div>

      {/* ── MAIN TOOL ── */}
      <button
        onClick={() => setLocation("/knowledge")}
        style={{
          width: "100%", padding: "22px 20px", borderRadius: 18,
          background: "linear-gradient(135deg, #312e81, #4338ca)",
          border: "2px solid #6366f1",
          cursor: "pointer", textAlign: "right",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
        }}
      >
        <div style={{ fontSize: 36 }}>🧠</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>מרכז הידע</div>
          <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>
            Markdown · Mermaid · קישורים · AI
          </div>
        </div>
        <div style={{ marginRight: "auto", fontSize: 20, color: "#6366f1" }}>←</div>
      </button>

      {/* Graph shortcut */}
      <button
        onClick={() => setLocation("/knowledge/graph")}
        style={{
          width: "100%", padding: "14px 20px", borderRadius: 14,
          background: "#1e1b4b", border: "1px solid #3730a3",
          cursor: "pointer", textAlign: "right",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <div style={{ fontSize: 24 }}>🕸️</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#a5b4fc" }}>גרף קשרים</div>
      </button>

      {/* Divider */}
      <div style={{ height: 1, background: "#1e293b", margin: "8px 0" }} />

      {/* Bureaucracy */}
      <button
        onClick={() => setLocation("/bureaucracy")}
        style={{
          width: "100%", padding: "16px 20px", borderRadius: 14,
          background: "#1c0a0a", border: "1px solid #7f1d1d",
          cursor: "pointer", textAlign: "right",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <div style={{ fontSize: 24 }}>🏛️</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fca5a5" }}>בירוקרטיה</div>
          <div style={{ fontSize: 11, color: "#ef4444" }}>161 · ביטוח לאומי · מס הכנסה</div>
        </div>
      </button>

      {/* Finance */}
      <button
        onClick={() => setLocation("/finance-snapshot")}
        style={{
          width: "100%", padding: "16px 20px", borderRadius: 14,
          background: "#071a0f", border: "1px solid #14532d",
          cursor: "pointer", textAlign: "right",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <div style={{ fontSize: 24 }}>💰</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#86efac" }}>מצב כספי</div>
          <div style={{ fontSize: 11, color: "#4ade80" }}>2,800₪ קצבה · חובות · פיצויים</div>
        </div>
      </button>

      {/* Daily Brain */}
      <button
        onClick={() => setLocation("/brain")}
        style={{
          width: "100%", padding: "16px 20px", borderRadius: 14,
          background: "#0c1220", border: "1px solid #1e3a5f",
          cursor: "pointer", textAlign: "right",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <div style={{ fontSize: 24 }}>⚡</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#93c5fd" }}>עכשיו</div>
          <div style={{ fontSize: 11, color: "#60a5fa" }}>הצעד הבא · פיצ' · הערה</div>
        </div>
      </button>

    </div>
  );
}
