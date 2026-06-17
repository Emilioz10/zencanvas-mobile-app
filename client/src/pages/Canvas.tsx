import { JsonCanvas } from "@/components/JsonCanvas";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Canvas() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated && !user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, background: "#f8fafc" }}>
        <div style={{ fontSize: 48 }}>🎨</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#374151" }}>Sign in to use your canvas</div>
        <a
          href={getLoginUrl()}
          style={{ padding: "12px 24px", borderRadius: 10, background: "#6366f1", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 15 }}
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <JsonCanvas />
    </div>
  );
}
