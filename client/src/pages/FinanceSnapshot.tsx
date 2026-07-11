/**
 * FinanceSnapshot — תמונת מצב כספית
 *
 * מציג את המצב הכספי הנוכחי של המשתמש:
 * - הכנסות: קצבת נכות ביטוח לאומי
 * - חובות: ביטוח לאומי, Keep, אחרים
 * - פיצויים תקועים
 * - חישוב חי: כמה נשאר אחרי חובות
 *
 * NoteCalc-style: שורות טקסט + חישוב אוטומטי
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── נתונים ממשיים ──────────────────────────────────────────────────────────

interface FinanceLine {
  id: string;
  label: string;
  amount: number;
  type: "income" | "expense" | "debt" | "frozen";
  note?: string;
  source?: string;
  editable?: boolean;
}

const INITIAL_LINES: FinanceLine[] = [
  // הכנסות
  {
    id: "nli-pension",
    label: "קצבת נכות כללית — ביטוח לאומי",
    amount: 2800,
    type: "income",
    note: "65% אי-כושר יציב, תוקף לצמיתות",
    source: "ביטוח לאומי",
  },
  // חובות שוטפים
  {
    id: "nli-debt",
    label: "חוב דמי ביטוח — ביטוח לאומי",
    amount: -823,
    type: "debt",
    note: "לתשלום מיידי",
    source: "ביטוח לאומי",
  },
  {
    id: "keep-debt",
    label: "חוב Keep",
    amount: -112.1,
    type: "debt",
    note: "התראת תשלום נשלחה",
    source: "Keep",
  },
  // כספים תקועים
  {
    id: "pension-frozen",
    label: "פיצויים תקועים — קרן פנסיה",
    amount: 280000,
    type: "frozen",
    note: "ממתין לטופס 161 ואישור מס הכנסה. רכיב פיצויים ~80K פטור, תגמולים ~200K בבדיקה.",
    source: "קרן פנסיה",
  },
];

// ─── עזרים ──────────────────────────────────────────────────────────────────

function formatILS(n: number): string {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);
}

const TYPE_CONFIG = {
  income:  { label: "הכנסה",  color: "#16a34a", bg: "#f0fdf4", border: "#86efac", sign: "+" },
  expense: { label: "הוצאה",  color: "#d97706", bg: "#fffbeb", border: "#fcd34d", sign: "−" },
  debt:    { label: "חוב",    color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", sign: "−" },
  frozen:  { label: "תקוע",   color: "#7c3aed", bg: "#faf5ff", border: "#c4b5fd", sign: "❄️" },
};

// ─── NoteCalc-style editor ───────────────────────────────────────────────────

function NoteCalcEditor() {
  const [text, setText] = useState(
    `קצבת נכות: 2800
חוב ביטוח לאומי: -823
Keep: -112.1
`
  );

  // Parse lines: find "label: number" patterns
  const lines = text.split("\n");
  const parsed = lines.map(line => {
    const m = line.match(/^(.+?):\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!m) return { label: line, value: null };
    return { label: m[1].trim(), value: parseFloat(m[2]) };
  });

  const total = parsed.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const positive = parsed.filter(l => l.value !== null && l.value > 0).reduce((s, l) => s + l.value!, 0);
  const negative = parsed.filter(l => l.value !== null && l.value < 0).reduce((s, l) => s + l.value!, 0);

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>🧮 מחשבון חי</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>תבנית: שם: סכום</span>
      </div>
      <div style={{ display: "flex", gap: 0 }}>
        {/* Text area */}
        <div style={{ flex: 1, position: "relative" }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            style={{
              width: "100%", minHeight: 140, padding: "12px 16px",
              border: "none", outline: "none", resize: "none",
              fontFamily: "monospace", fontSize: 14, lineHeight: 1.8,
              direction: "rtl", background: "#fafafa",
            }}
            placeholder="שם: סכום&#10;לדוגמה: קצבה: 2800&#10;חוב: -500"
          />
        </div>
        {/* Results column */}
        <div style={{ width: 90, borderRight: "1px solid #e2e8f0", padding: "12px 8px", background: "#f8fafc" }}>
          {parsed.map((l, i) => (
            <div key={i} style={{
              height: "1.8em", display: "flex", alignItems: "center", justifyContent: "flex-end",
              fontSize: 13, fontWeight: l.value !== null ? 700 : 400,
              color: l.value === null ? "transparent" : l.value >= 0 ? "#16a34a" : "#dc2626",
              fontFamily: "monospace",
            }}>
              {l.value !== null ? formatILS(l.value) : ""}
            </div>
          ))}
        </div>
      </div>
      {/* Totals */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>סה"כ הכנסות</div>
          <div style={{ fontWeight: 700, color: "#16a34a", fontSize: 15 }}>{formatILS(positive)}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>סה"כ חובות</div>
          <div style={{ fontWeight: 700, color: "#dc2626", fontSize: 15 }}>{formatILS(negative)}</div>
        </div>
        <div style={{ textAlign: "center", marginRight: "auto" }}>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>נטו</div>
          <div style={{ fontWeight: 800, color: total >= 0 ? "#16a34a" : "#dc2626", fontSize: 18 }}>
            {formatILS(total)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── קומפוננט ראשי ──────────────────────────────────────────────────────────

export default function FinanceSnapshot() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [lines, setLines] = useState<FinanceLine[]>(INITIAL_LINES);
  const [showCalc, setShowCalc] = useState(false);

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ direction: "rtl", color: "#64748b" }}>יש להתחבר</p>
      </div>
    );
  }

  const income = lines.filter(l => l.type === "income").reduce((s, l) => s + l.amount, 0);
  const debts = lines.filter(l => l.type === "debt" || l.type === "expense").reduce((s, l) => s + l.amount, 0);
  const frozen = lines.filter(l => l.type === "frozen").reduce((s, l) => s + l.amount, 0);
  const net = income + debts;

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", direction: "rtl" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setLocation("/")}
            style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 4 }}
          >
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>תמונת מצב כספית</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>נכון להיום</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ padding: "16px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginBottom: 4 }}>הכנסה חודשית</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#15803d" }}>{formatILS(income)}</div>
          <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>קצבת נכות</div>
        </div>
        <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, marginBottom: 4 }}>חובות פתוחים</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>{formatILS(Math.abs(debts))}</div>
          <div style={{ fontSize: 11, color: "#f87171", marginTop: 2 }}>ביטוח לאומי + Keep</div>
        </div>
        <div style={{ background: "#eff6ff", border: "1.5px solid #93c5fd", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 700, marginBottom: 4 }}>נטו חודשי</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: net >= 0 ? "#15803d" : "#dc2626" }}>{formatILS(net)}</div>
          <div style={{ fontSize: 11, color: "#60a5fa", marginTop: 2 }}>אחרי חובות</div>
        </div>
        <div style={{ background: "#faf5ff", border: "1.5px solid #c4b5fd", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, marginBottom: 4 }}>פיצויים תקועים</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#7c3aed" }}>{formatILS(frozen)}</div>
          <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>ממתין לטופס 161</div>
        </div>
      </div>

      {/* Lines list */}
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {lines.map(line => {
          const cfg = TYPE_CONFIG[line.type];
          return (
            <div
              key={line.id}
              style={{
                background: cfg.bg,
                border: `1.5px solid ${cfg.border}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 4 }}>{line.label}</div>
                {line.note && <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{line.note}</div>}
                {line.source && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>מקור: {line.source}</div>}
              </div>
              <div style={{ textAlign: "left", flexShrink: 0 }}>
                <div style={{
                  fontWeight: 800, fontSize: 16,
                  color: line.type === "frozen" ? "#7c3aed" : line.amount >= 0 ? "#16a34a" : "#dc2626",
                }}>
                  {line.type === "frozen" ? "❄️ " : ""}{formatILS(Math.abs(line.amount))}
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: cfg.color,
                  background: cfg.color + "18", borderRadius: 6, padding: "2px 6px",
                  marginTop: 4, textAlign: "center",
                }}>
                  {cfg.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* NoteCalc toggle */}
      <div style={{ padding: "16px 16px 0" }}>
        <button
          onClick={() => setShowCalc(v => !v)}
          style={{
            width: "100%", padding: "12px 16px",
            background: showCalc ? "#1e293b" : "#fff",
            color: showCalc ? "#fff" : "#1e293b",
            border: "1.5px solid #e2e8f0",
            borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          🧮 {showCalc ? "הסתר מחשבון" : "פתח מחשבון חי"}
        </button>
        {showCalc && (
          <div style={{ marginTop: 12 }}>
            <NoteCalcEditor />
          </div>
        )}
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}
