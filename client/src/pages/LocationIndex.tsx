import { useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, MapPin, ExternalLink } from "lucide-react";

// ─── Static data: where everything lives ──────────────────────────────────

interface StorageItem {
  what: string;
  how: string; // how to retrieve
}

interface ToolLocation {
  id: string;
  name: string;
  emoji: string;
  color: string;
  category: "voice" | "notes" | "finance" | "files" | "tasks" | "health" | "communication";
  categoryLabel: string;
  url?: string;
  items: StorageItem[];
}

const LOCATIONS: ToolLocation[] = [
  {
    id: "voicenotes",
    name: "Voicenotes",
    emoji: "🎙️",
    color: "#7c3aed",
    category: "voice",
    categoryLabel: "הקלטות",
    url: "https://voicenotes.com",
    items: [
      { what: "הקלטות קוליות יומיות (1,460+)", how: "פתח אפליקציה → רשימה כרונולוגית" },
      { what: "תמלולים אוטומטיים", how: "לחץ על הקלטה → תמלול" },
      { what: "מחשבות, תסכולים, תוכניות", how: "חפש לפי תאריך או מילת מפתח" },
      { what: "הנחיות רפואיות מרופאים", how: "חפש 'רופא' / 'ד\"ר'" },
    ],
  },
  {
    id: "gmail",
    name: "Gmail",
    emoji: "📧",
    color: "#ea4335",
    category: "communication",
    categoryLabel: "תקשורת",
    url: "https://mail.google.com",
    items: [
      { what: "התכתבויות עם ביטוח לאומי", how: "חפש: ביטוח לאומי" },
      { what: "מיילים מ-Voicenotes / Fabric / File.ai", how: "חפש: voicenotes OR fabric OR file.ai" },
      { what: "מסמכים רפואיים שנשלחו", how: "חפש: קבצים מצורפים + שם רופא" },
      { what: "חשבוניות ותשלומים", how: "חפש: חשבונית OR תשלום" },
    ],
  },
  {
    id: "gdrive",
    name: "Google Drive",
    emoji: "📁",
    color: "#fbbc04",
    category: "files",
    categoryLabel: "קבצים",
    url: "https://drive.google.com",
    items: [
      { what: "מסמכי תביעת נכות", how: "תיקייה: ביטוח לאומי" },
      { what: "צילומי מסמכים רפואיים", how: "תיקייה: בריאות" },
      { what: "מסמכי מס הכנסה ופיצויים", how: "תיקייה: כספים" },
      { what: "תמונות ואחר", how: "Google Photos מסונכרן" },
    ],
  },
  {
    id: "notecalc",
    name: "NoteCalc",
    emoji: "🧮",
    color: "#059669",
    category: "finance",
    categoryLabel: "כספים",
    items: [
      { what: "חישובי חובות ותשלומים", how: "פתח אפליקציה → רשימת מחברות" },
      { what: "תזרים מזומנים חודשי", how: "מחברת: תזרים" },
      { what: "חישוב נכסים והתחייבויות", how: "מחברת: נכסים" },
    ],
  },
  {
    id: "obsidian",
    name: "Obsidian",
    emoji: "💎",
    color: "#7c3aed",
    category: "notes",
    categoryLabel: "הערות",
    items: [
      { what: "מדריכים ופרוצדורות", how: "Vault → תיקיית מדריכים" },
      { what: "רשימות קטגוריות ומבנים", how: "Vault → תיקיית מבנה" },
      { what: "הערות ארוכות ומחקר", how: "חפש Ctrl+O" },
    ],
  },
  {
    id: "anytype",
    name: "Anytype",
    emoji: "🔷",
    color: "#3b82f6",
    category: "notes",
    categoryLabel: "הערות",
    url: "https://anytype.io",
    items: [
      { what: "אובייקטים מובנים (אנשים, פרויקטים)", how: "פתח → Library → Objects" },
      { what: "תבניות מוכנות", how: "פתח → Templates" },
      { what: "מסד ידע אישי", how: "חפש בתוך האפליקציה" },
    ],
  },
  {
    id: "everyday",
    name: "Everyday Tasks",
    emoji: "📋",
    color: "#f59e0b",
    category: "tasks",
    categoryLabel: "משימות",
    url: "https://everydaytasks.jepfa.de",
    items: [
      { what: "שגרות יומיות (כלב, תינוק, בית)", how: "פתח → רשימת שגרות" },
      { what: "מעקב תדירות פעולות", how: "לחץ על פעולה → היסטוריה" },
      { what: "סטטיסטיקות שגרה", how: "פתח → Statistics" },
    ],
  },
  {
    id: "bluecoins",
    name: "Bluecoins",
    emoji: "💰",
    color: "#0ea5e9",
    category: "finance",
    categoryLabel: "כספים",
    items: [
      { what: "הוצאות והכנסות יומיות", how: "פתח → Transactions" },
      { what: "תקציב חודשי", how: "פתח → Budget" },
      { what: "דוחות גרפיים", how: "פתח → Reports" },
    ],
  },
  {
    id: "zencanvas",
    name: "ZenCanvas (כאן)",
    emoji: "🌿",
    color: "#10b981",
    category: "tasks",
    categoryLabel: "משימות",
    items: [
      { what: "אנשים ואינטראקציות (FRM)", how: "תפריט → אנשים" },
      { what: "יומן יומי (רני, פיצ', בריאות, כסף)", how: "תפריט → יומן יומי" },
      { what: "מדריכים ויזואליים", how: "תפריט → כישורים" },
      { what: "משימות ופרויקטים", how: "תפריט → משימות" },
      { what: "Canvas ויזואלי", how: "תפריט → Canvas" },
    ],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  voice: "🎙️ הקלטות",
  notes: "📝 הערות",
  finance: "💰 כספים",
  files: "📁 קבצים",
  tasks: "✅ משימות",
  health: "💊 בריאות",
  communication: "📧 תקשורת",
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function LocationIndex() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = LOCATIONS.filter((loc) => {
    const matchesSearch =
      !search ||
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.items.some(
        (item) =>
          item.what.includes(search) || item.how.includes(search)
      );
    const matchesCategory = !selectedCategory || loc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(LOCATIONS.map((l) => l.category)));

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">איפה הכל?</h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pr-9 text-right"
            placeholder="חפש מה אתה מחפש..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            הכל
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Tool cards */}
      <div className="p-4 space-y-3">
        {filtered.map((loc) => (
          <div
            key={loc.id}
            className="rounded-xl border border-border bg-card overflow-hidden"
            style={{ borderRightColor: loc.color, borderRightWidth: 4 }}
          >
            {/* Card header */}
            <button
              className="w-full flex items-center justify-between p-4 text-right"
              onClick={() => setExpandedId(expandedId === loc.id ? null : loc.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{loc.emoji}</span>
                <div>
                  <div className="font-semibold text-sm">{loc.name}</div>
                  <Badge variant="secondary" className="text-xs mt-0.5">
                    {CATEGORY_LABELS[loc.category]}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{loc.items.length} פריטים</span>
                <span
                  className={`text-muted-foreground transition-transform duration-200 ${
                    expandedId === loc.id ? "rotate-90" : ""
                  }`}
                >
                  ‹
                </span>
              </div>
            </button>

            {/* Expanded content */}
            {expandedId === loc.id && (
              <div className="border-t border-border">
                <div className="divide-y divide-border">
                  {loc.items.map((item, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="font-medium text-sm text-foreground mb-1">
                        📌 {item.what}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        🔍 {item.how}
                      </div>
                    </div>
                  ))}
                </div>

                {loc.url && (
                  <div className="p-3 border-t border-border">
                    <a
                      href={loc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-primary"
                    >
                      <ExternalLink className="w-3 h-3" />
                      פתח {loc.name}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>לא נמצאו תוצאות</p>
          </div>
        )}
      </div>
    </div>
  );
}
