import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

type CapabilityLevel = "full" | "partial" | "none" | "unknown";

type AppEntry = {
  name: string;
  category: string;
  free: boolean;
  capabilities: Record<string, CapabilityLevel>;
  notes?: string;
  userHas?: boolean;
};

type Capability = {
  id: string;
  label: string;
  emoji: string;
  description: string;
};

// ─── Capability Definitions ───────────────────────────────────────────────────

const CAPABILITIES: Capability[] = [
  { id: "capture", label: "לכידה", emoji: "🎤", description: "הקלטה / כתיבה מהירה" },
  { id: "transcribe", label: "תמלול", emoji: "📝", description: "המרת קול לטקסט" },
  { id: "organize", label: "ארגון", emoji: "🗂️", description: "קטגוריות / תיקיות / תגיות" },
  { id: "retrieve", label: "שליפה", emoji: "🔍", description: "חיפוש וסינון" },
  { id: "track", label: "מעקב", emoji: "📊", description: "מעקב יומי / לוגים" },
  { id: "hebrew", label: "עברית", emoji: "🇮🇱", description: "תמיכה מלאה בעברית + RTL" },
  { id: "offline", label: "אופליין", emoji: "📴", description: "עובד ללא אינטרנט" },
  { id: "export", label: "ייצוא", emoji: "📤", description: "ייצוא נתונים" },
  { id: "free", label: "חינם", emoji: "💸", description: "חינמי / ללא מנוי" },
];

// ─── App Data (based on user's 373-app backup) ────────────────────────────────

const APPS: AppEntry[] = [
  {
    name: "Voicenotes",
    category: "הקלטה",
    free: false,
    userHas: true,
    notes: "תמלול מעולה, אבל אין שליפה חכמה. לא עובד ללא אינטרנט. עלות חודשית.",
    capabilities: {
      capture: "full", transcribe: "full", organize: "partial",
      retrieve: "partial", track: "none", hebrew: "partial",
      offline: "none", export: "partial", free: "none",
    },
  },
  {
    name: "Obsidian",
    category: "ידע",
    free: true,
    userHas: true,
    notes: "מעולה לארגון, אבל לא אינטואיטיבי. דורש הגדרה ידנית. אין תמלול.",
    capabilities: {
      capture: "partial", transcribe: "none", organize: "full",
      retrieve: "full", track: "partial", hebrew: "partial",
      offline: "full", export: "full", free: "full",
    },
  },
  {
    name: "Fabric",
    category: "ידע",
    free: false,
    userHas: true,
    notes: "AI חזק, אבל לא עובד בעברית. מנוי יקר.",
    capabilities: {
      capture: "full", transcribe: "partial", organize: "full",
      retrieve: "full", track: "none", hebrew: "none",
      offline: "none", export: "partial", free: "none",
    },
  },
  {
    name: "NoteCalc",
    category: "פיננסי",
    free: true,
    userHas: true,
    notes: "מחשבון עם הערות. מצוין לחישובים פיננסיים. אין מעקב לאורך זמן.",
    capabilities: {
      capture: "partial", transcribe: "none", organize: "partial",
      retrieve: "partial", track: "partial", hebrew: "partial",
      offline: "full", export: "partial", free: "full",
    },
  },
  {
    name: "Everyday Tasks",
    category: "מעקב",
    free: true,
    userHas: true,
    notes: "מעקב מעולה עם גרפים. אבל ממשק מסובך. אין עברית.",
    capabilities: {
      capture: "partial", transcribe: "none", organize: "full",
      retrieve: "full", track: "full", hebrew: "none",
      offline: "full", export: "full", free: "full",
    },
  },
  {
    name: "NarraBaby",
    category: "מעקב תינוק",
    free: false,
    userHas: false,
    notes: "מעקב תינוק מובנה. ממשק נוח. אבל רק לתינוקות.",
    capabilities: {
      capture: "full", transcribe: "none", organize: "full",
      retrieve: "full", track: "full", hebrew: "none",
      offline: "partial", export: "partial", free: "none",
    },
  },
  {
    name: "Anytype",
    category: "ידע",
    free: true,
    userHas: true,
    notes: "מבנה גמיש. אבל מורכב מאוד ללמידה. עברית חלקית.",
    capabilities: {
      capture: "partial", transcribe: "none", organize: "full",
      retrieve: "full", track: "partial", hebrew: "partial",
      offline: "full", export: "full", free: "full",
    },
  },
  {
    name: "Capacities",
    category: "ידע",
    free: false,
    userHas: true,
    notes: "ממשק יפה. אבל מנוי יקר. אין עברית.",
    capabilities: {
      capture: "partial", transcribe: "none", organize: "full",
      retrieve: "full", track: "partial", hebrew: "none",
      offline: "none", export: "partial", free: "none",
    },
  },
  {
    name: "Notion",
    category: "ידע",
    free: false,
    userHas: true,
    notes: "הכי פופולרי. אבל כבד, איטי, ואין עברית אמיתית.",
    capabilities: {
      capture: "partial", transcribe: "none", organize: "full",
      retrieve: "full", track: "partial", hebrew: "partial",
      offline: "none", export: "full", free: "partial",
    },
  },
  {
    name: "Joplin",
    category: "הערות",
    free: true,
    userHas: true,
    notes: "קוד פתוח. Markdown. אבל ממשק ישן. אין AI.",
    capabilities: {
      capture: "partial", transcribe: "none", organize: "full",
      retrieve: "partial", track: "none", hebrew: "partial",
      offline: "full", export: "full", free: "full",
    },
  },
  {
    name: "Markor",
    category: "הערות",
    free: true,
    userHas: true,
    notes: "עורך Markdown מקומי. פשוט ומהיר. אין סנכרון.",
    capabilities: {
      capture: "partial", transcribe: "none", organize: "partial",
      retrieve: "partial", track: "none", hebrew: "full",
      offline: "full", export: "partial", free: "full",
    },
  },
  {
    name: "Bluecoins",
    category: "פיננסי",
    free: true,
    userHas: true,
    notes: "מעקב הוצאות מעולה. אבל רק כסף. אין קישור לשאר החיים.",
    capabilities: {
      capture: "full", transcribe: "none", organize: "full",
      retrieve: "full", track: "full", hebrew: "partial",
      offline: "full", export: "full", free: "full",
    },
  },
  {
    name: "Track & Graph",
    category: "מעקב",
    free: true,
    userHas: true,
    notes: "גרפים מותאמים אישית. אבל דורש הגדרה ידנית. אין עברית.",
    capabilities: {
      capture: "partial", transcribe: "none", organize: "partial",
      retrieve: "full", track: "full", hebrew: "none",
      offline: "full", export: "full", free: "full",
    },
  },
  {
    name: "ZenCanvas (זה)",
    category: "הכל",
    free: true,
    userHas: true,
    notes: "מבנה אחד לכל הנושאים. עברית מלאה. מעקב יומי. ציר זמן.",
    capabilities: {
      capture: "full", transcribe: "partial", organize: "full",
      retrieve: "full", track: "full", hebrew: "full",
      offline: "partial", export: "partial", free: "full",
    },
  },
];

// ─── Cell Component ────────────────────────────────────────────────────────────

function CapabilityCell({ level }: { level: CapabilityLevel }) {
  if (level === "full") return <span className="text-lg">✅</span>;
  if (level === "partial") return <span className="text-lg">🟡</span>;
  if (level === "none") return <span className="text-lg">❌</span>;
  return <span className="text-lg text-gray-300">—</span>;
}

// ─── Gap Analysis ─────────────────────────────────────────────────────────────

function GapAnalysis() {
  const userApps = APPS.filter((a) => a.userHas);

  const gaps: { cap: Capability; coverage: number; bestApp: string }[] = CAPABILITIES.map((cap) => {
    const fullCount = userApps.filter((a) => a.capabilities[cap.id] === "full").length;
    const coverage = Math.round((fullCount / userApps.length) * 100);
    const bestApp = APPS.filter((a) => a.capabilities[cap.id] === "full")[0]?.name || "אין";
    return { cap, coverage, bestApp };
  });

  const criticalGaps = gaps.filter((g) => g.coverage < 30);

  return (
    <div className="bg-red-50 rounded-2xl p-4 mb-6 border border-red-100" dir="rtl">
      <h3 className="font-bold text-red-700 mb-3 text-right">⚠️ פערים קריטיים</h3>
      <div className="space-y-2">
        {criticalGaps.map(({ cap, coverage, bestApp }) => (
          <div key={cap.id} className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              הכי טוב: <span className="font-medium">{bestApp}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-red-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${coverage}%` }}
                />
              </div>
              <span className="text-sm font-bold text-right">
                {cap.emoji} {cap.label}
              </span>
            </div>
          </div>
        ))}
        {criticalGaps.length === 0 && (
          <div className="text-sm text-green-600">אין פערים קריטיים בכלים שלך 🎉</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AppMap() {
  const [filter, setFilter] = useState<"all" | "mine">("mine");
  const [selectedApp, setSelectedApp] = useState<AppEntry | null>(null);

  const displayApps = filter === "mine" ? APPS.filter((a) => a.userHas) : APPS;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("mine")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "mine" ? "bg-purple-100 text-purple-700" : "text-gray-500"
              }`}
            >
              הכלים שלי
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "all" ? "bg-purple-100 text-purple-700" : "text-gray-500"
              }`}
            >
              כל הכלים
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-gray-500">← חזרה</Link>
            <h1 className="text-lg font-bold text-gray-800">מפת כלים</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-4xl mx-auto">
        {/* Gap Analysis */}
        <GapAnalysis />

        {/* Legend */}
        <div className="flex gap-4 justify-end mb-4 text-sm text-gray-500">
          <span>❌ אין</span>
          <span>🟡 חלקי</span>
          <span>✅ מלא</span>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right p-3 font-semibold text-gray-700 sticky right-0 bg-white min-w-[120px]">
                  כלי
                </th>
                {CAPABILITIES.map((cap) => (
                  <th
                    key={cap.id}
                    className="p-2 text-center font-medium text-gray-600 min-w-[60px]"
                    title={cap.description}
                  >
                    <div>{cap.emoji}</div>
                    <div className="text-xs">{cap.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayApps.map((app, i) => (
                <tr
                  key={app.name}
                  className={`border-b border-gray-50 cursor-pointer transition-colors hover:bg-purple-50 ${
                    app.name === "ZenCanvas (זה)" ? "bg-purple-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                  onClick={() => setSelectedApp(selectedApp?.name === app.name ? null : app)}
                >
                  <td className="p-3 sticky right-0 bg-inherit">
                    <div className="font-medium text-gray-800">{app.name}</div>
                    <div className="text-xs text-gray-400">{app.category}</div>
                  </td>
                  {CAPABILITIES.map((cap) => (
                    <td key={cap.id} className="p-2 text-center">
                      <CapabilityCell level={app.capabilities[cap.id] as CapabilityLevel} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected App Detail */}
        {selectedApp && (
          <div
            className="mt-4 p-4 rounded-2xl border-2 bg-white"
            style={{ borderColor: selectedApp.name === "ZenCanvas (זה)" ? "#8b5cf6" : "#e5e7eb" }}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant={selectedApp.free ? "default" : "secondary"}>
                {selectedApp.free ? "חינמי" : "בתשלום"}
              </Badge>
              <h3 className="font-bold text-lg">{selectedApp.name}</h3>
            </div>
            {selectedApp.notes && (
              <p className="text-gray-600 text-sm text-right">{selectedApp.notes}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3 justify-end">
              {CAPABILITIES.filter((c) => selectedApp.capabilities[c.id] === "full").map((c) => (
                <span key={c.id} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {c.emoji} {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 p-4 bg-purple-50 rounded-2xl border border-purple-100" dir="rtl">
          <h3 className="font-bold text-purple-700 mb-2 text-right">💡 מסקנה</h3>
          <p className="text-sm text-gray-700 text-right leading-relaxed">
            יש לך {APPS.filter((a) => a.userHas).length} כלים פעילים. הבעיה היא לא חוסר כלים — 
            אלא שכל כלי עושה חלק אחד. <strong>ZenCanvas</strong> מנסה לאחד את הכל במקום אחד 
            עם עברית מלאה ומעקב יומי מובנה.
          </p>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/tracker">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium text-sm">
              📋 יומן מעקב
            </button>
          </Link>
          <Link href="/">
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium text-sm">
              🏠 בית
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
