/**
 * BureaucracyTracker — מעקב בירוקרטיה
 *
 * מציג את כל התיקים הפתוחים הממשיים של המשתמש:
 * - טופס 161 + פיצויים תקועים
 * - חוב ביטוח לאומי
 * - בקשת פטור מס הכנסה
 * - Keep / חובות קטנים
 * - חיסון כלבת + רישיון כלב
 * - חידוש תעודת זהות
 *
 * כל תיק: סטטוס (ירוק/צהוב/אדום), תאריך יעד, צעד הבא, מספר טלפון/אסמכתא
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── טיפוסים ────────────────────────────────────────────────────────────────

type CaseStatus = "urgent" | "pending" | "waiting" | "done";

interface BureaucracyCase {
  id: string;
  title: string;
  agency: string;
  agencyPhone?: string;
  referenceNumber?: string;
  status: CaseStatus;
  deadlineDate?: string; // ISO date string
  nextAction: string;
  notes?: string;
  amount?: string; // ₪ amount if financial
  domain: "pension" | "tax" | "insurance" | "debt" | "dog" | "id" | "health" | "other";
}

// ─── נתוני תיקים אמיתיים ────────────────────────────────────────────────────

const REAL_CASES: BureaucracyCase[] = [
  {
    id: "pension-161",
    title: "טופס 161 — שחרור פיצויים",
    agency: "מס הכנסה + קרן פנסיה",
    agencyPhone: "4954",
    referenceNumber: "14463374",
    status: "urgent",
    nextAction: "לבדוק סטטוס פנייה ב-MyInquiries. אם אין תשובה — להתקשר 4954 ולציין אסמכתא 14463374",
    notes: "רכיב פיצויים ~80,000₪ — פטור מלא כבר אושר. רכיב תגמולים ~200,000₪ — בבדיקה. מס הכנסה עצמם הם המעסיק (רשות המסים) — הם צריכים לספק טופס 161 לעצמם.",
    amount: "~280,000₪",
    domain: "pension",
  },
  {
    id: "bituach-leumi-debt",
    title: "חוב ביטוח לאומי — דמי ביטוח",
    agency: "ביטוח לאומי",
    agencyPhone: "03-5022591",
    status: "pending",
    nextAction: "לשלם 823₪ דרך מספר תשלום טלפוני 03-5022591 או אזור אישי",
    notes: "חוב דמי ביטוח. ניתן לשלם בטלפון או אזור אישי.",
    amount: "823₪",
    domain: "insurance",
  },
  {
    id: "tax-exemption",
    title: "בקשת פטור ממס — פנסיה ונכות",
    agency: "רשות המסים",
    agencyPhone: "4954",
    referenceNumber: "14463374",
    status: "waiting",
    nextAction: "לחכות לאישור פנייה. כשמגיעה הודעה — לעדכן את בתאל בוואטסאפ.",
    notes: "57% נכות רפואית + 65% אי-כושר עבודה לצמיתות. הפנייה הוגשה. ממתין לתשובה על רכיב התגמולים.",
    domain: "tax",
  },
  {
    id: "keep-debt",
    title: "חוב Keep — התראת תשלום",
    agency: "Keep",
    status: "pending",
    nextAction: "לשלם 112.1₪ דרך הקישור שנשלח ב-SMS",
    amount: "112.1₪",
    domain: "debt",
  },
  {
    id: "dog-vaccine",
    title: "חיסון כלבת + רישיון כלב — פיצ'",
    agency: "עיריית חולון / Vetclick",
    agencyPhone: "Vetclick",
    status: "urgent",
    deadlineDate: "2026-06-16",
    nextAction: "לתאם חיסון כלבת + חידוש רישיון החזקה. ניתן לשלם מראש דרך Petclick.",
    notes: "פיצ' — כלב מסוכן לפי רישום. תוקף חיסון ורישיון פג 16/06/2026.",
    domain: "dog",
  },
  {
    id: "id-renewal",
    title: "חידוש תעודת זהות + דרכון",
    agency: "משרד הפנים",
    status: "pending",
    nextAction: "תור נקבע לנתניה 25/05/2026 שעה 11:00. לוודא שהתור עדיין תקף.",
    notes: "תוקף תעודת זהות פג. גם דרכון צריך חידוש. שינוי מצב אישי (נישואין) — לעדכן ספח.",
    domain: "id",
  },
  {
    id: "disability-appeal",
    title: "ערר נכות — הגעה ל-75%",
    agency: "ביטוח לאומי",
    status: "pending",
    nextAction: "להגיש ערר על אחוזי הנכות. יש עוד שתי הרהורים (ועדות) שניתן לנצל. לאסוף בדיקות נוספות.",
    notes: "כרגע: 57% נכות רפואית + 65% אי-כושר עבודה. בהגעה ל-75% — הטבות מלאות. ארבעה עורכי דין הוחלפו. לשקול ייצוג חדש.",
    domain: "insurance",
  },
];

// ─── עזרים ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  urgent:  { label: "דחוף",      color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", dot: "#dc2626" },
  pending: { label: "ממתין",     color: "#d97706", bg: "#fffbeb", border: "#fcd34d", dot: "#f59e0b" },
  waiting: { label: "בהמתנה",    color: "#2563eb", bg: "#eff6ff", border: "#93c5fd", dot: "#3b82f6" },
  done:    { label: "הושלם",     color: "#16a34a", bg: "#f0fdf4", border: "#86efac", dot: "#22c55e" },
};

const DOMAIN_EMOJI: Record<string, string> = {
  pension: "💼",
  tax: "🏛️",
  insurance: "🛡️",
  debt: "💳",
  dog: "🐕",
  id: "🪪",
  health: "🏥",
  other: "📋",
};

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function DeadlineBadge({ dateStr }: { dateStr?: string }) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  const color = days < 0 ? "#dc2626" : days <= 3 ? "#dc2626" : days <= 7 ? "#d97706" : "#16a34a";
  const label = days < 0 ? `עבר לפני ${Math.abs(days)} ימים` : days === 0 ? "היום!" : `${days} ימים`;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: color + "18", color, border: `1px solid ${color}40`,
      borderRadius: 8, padding: "2px 8px", fontSize: 12, fontWeight: 700,
    }}>
      ⏰ {label}
    </span>
  );
}

// ─── קומפוננט ראשי ──────────────────────────────────────────────────────────

export default function BureaucracyTracker() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<CaseStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load user-saved cases from DB (entities with domain=admin)
  const { data: savedCases } = trpc.entities.list.useQuery(
    { domain: "admin" },
    { staleTime: 30_000 }
  );

  const createEntity = trpc.entities.create.useMutation({
    onSuccess: () => toast.success("תיק נשמר"),
    onError: () => toast.error("שגיאה בשמירה"),
  });

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <p style={{ direction: "rtl", color: "#64748b" }}>יש להתחבר כדי לראות את התיקים</p>
      </div>
    );
  }

  const filtered = filter === "all"
    ? REAL_CASES
    : REAL_CASES.filter(c => c.status === filter);

  // Most urgent case — first urgent, then pending
  const mostUrgent = REAL_CASES.find(c => c.status === "urgent") ?? REAL_CASES.find(c => c.status === "pending");

  const urgentCount = REAL_CASES.filter(c => c.status === "urgent").length;
  const pendingCount = REAL_CASES.filter(c => c.status === "pending").length;

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", direction: "rtl" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <button
            onClick={() => setLocation("/")}
            style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 4 }}
          >
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>מעקב בירוקרטיה</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              {urgentCount} דחוף · {pendingCount} ממתין
            </p>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["all", "urgent", "pending", "waiting", "done"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: "1.5px solid",
                borderColor: filter === f ? "#1e293b" : "#e2e8f0",
                background: filter === f ? "#1e293b" : "#fff",
                color: filter === f ? "#fff" : "#475569",
                cursor: "pointer",
              }}
            >
              {f === "all" ? "הכל" : STATUS_CONFIG[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Most urgent action banner */}
      {mostUrgent && filter === "all" && (
        <div style={{
          margin: "16px 16px 0",
          padding: "14px 16px",
          background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
          border: "1.5px solid #fca5a5",
          borderRadius: 14,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>
            🔴 הצעד הבא הדחוף ביותר
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
            {mostUrgent.title}
          </div>
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>
            {mostUrgent.nextAction}
          </div>
          {mostUrgent.agencyPhone && (
            <a
              href={`tel:${mostUrgent.agencyPhone}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                marginTop: 8, padding: "8px 16px",
                background: "#dc2626", color: "#fff",
                borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 14,
              }}
            >
              📞 {mostUrgent.agencyPhone}
            </a>
          )}
        </div>
      )}

      {/* Cases list */}
      <div style={{ padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(c => {
          const cfg = STATUS_CONFIG[c.status];
          const isExpanded = expandedId === c.id;
          return (
            <div
              key={c.id}
              style={{
                background: cfg.bg,
                border: `1.5px solid ${cfg.border}`,
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {/* Card header — always visible */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                style={{
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  padding: "16px 16px 12px", textAlign: "right",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 20 }}>{DOMAIN_EMOJI[c.domain]}</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{c.title}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {/* Status badge */}
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: cfg.color + "18", color: cfg.color,
                        border: `1px solid ${cfg.color}40`,
                        borderRadius: 8, padding: "2px 8px", fontSize: 12, fontWeight: 700,
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                        {cfg.label}
                      </span>
                      {c.amount && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{c.amount}</span>
                      )}
                      <DeadlineBadge dateStr={c.deadlineDate} />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: "#374151", lineHeight: 1.5, textAlign: "right" }}>
                      <strong>צעד הבא:</strong> {c.nextAction}
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: "#94a3b8", flexShrink: 0, marginTop: 2 }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${cfg.border}` }}>
                  {c.agency && (
                    <div style={{ marginTop: 12, fontSize: 13 }}>
                      <span style={{ color: "#64748b" }}>גורם: </span>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{c.agency}</span>
                    </div>
                  )}
                  {c.referenceNumber && (
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      <span style={{ color: "#64748b" }}>אסמכתא: </span>
                      <span style={{ fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>{c.referenceNumber}</span>
                    </div>
                  )}
                  {c.notes && (
                    <div style={{
                      marginTop: 10, padding: "10px 12px",
                      background: "rgba(255,255,255,0.7)", borderRadius: 10,
                      fontSize: 13, color: "#374151", lineHeight: 1.6,
                    }}>
                      {c.notes}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {c.agencyPhone && (
                      <a
                        href={`tel:${c.agencyPhone}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "8px 16px", background: cfg.color, color: "#fff",
                          borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 13,
                        }}
                      >
                        📞 {c.agencyPhone}
                      </a>
                    )}
                    <button
                      onClick={() => {
                        createEntity.mutate({
                          entityType: "task",
                          name: `✅ ${c.title}`,
                          domain: "admin",
                          body: `## ${c.title}\n\n**צעד הבא:** ${c.nextAction}\n\n${c.notes ?? ""}`,
                          tags: c.domain,
                        });
                      }}
                      style={{
                        padding: "8px 16px", background: "#fff",
                        border: `1.5px solid ${cfg.border}`,
                        borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer",
                        color: "#374151",
                      }}
                    >
                      💾 שמור כאובייקט
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: "1px solid #e2e8f0",
        padding: "12px 20px", textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", direction: "rtl" }}>
          המידע מבוסס על המסמכים שהועלו. לעדכון — ערוך ישירות.
        </p>
      </div>
    </div>
  );
}
