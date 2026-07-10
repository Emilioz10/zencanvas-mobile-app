import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type Topic = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  eventTypes: EventTypeConfig[];
};

type EventTypeConfig = {
  id: string;
  label: string;
  valueLabel?: string;
  unit?: string;
  hasTimer?: boolean;
};

// ─── Topic Definitions ───────────────────────────────────────────────────────

const TOPICS: Topic[] = [
  {
    id: "baby",
    label: "רני",
    emoji: "👶",
    color: "#ec4899",
    bgColor: "#fdf2f8",
    eventTypes: [
      { id: "feeding", label: "האכלה", valueLabel: "כמות (מ\"ל)", unit: "מ\"ל", hasTimer: true },
      { id: "sleep", label: "שינה", valueLabel: "משך (דקות)", unit: "דקות", hasTimer: true },
      { id: "diaper", label: "חיתול", valueLabel: "סוג (רטוב/מלוכלך)" },
      { id: "health", label: "בריאות", valueLabel: "תיאור" },
      { id: "note", label: "הערה" },
    ],
  },
  {
    id: "dog",
    label: "פיצ'",
    emoji: "🐕",
    color: "#f59e0b",
    bgColor: "#fffbeb",
    eventTypes: [
      { id: "feeding", label: "האכלה", valueLabel: "כמות (גרם)", unit: "גרם" },
      { id: "walk", label: "טיול", valueLabel: "משך (דקות)", unit: "דקות", hasTimer: true },
      { id: "medication", label: "תרופה", valueLabel: "שם תרופה" },
      { id: "vet", label: "וטרינר", valueLabel: "נושא" },
      { id: "note", label: "הערה" },
    ],
  },
  {
    id: "health",
    label: "בריאות",
    emoji: "💊",
    color: "#10b981",
    bgColor: "#f0fdf4",
    eventTypes: [
      { id: "medication", label: "תרופה", valueLabel: "שם + מינון" },
      { id: "appointment", label: "תור", valueLabel: "רופא / מקום" },
      { id: "symptom", label: "תסמין", valueLabel: "תיאור" },
      { id: "note", label: "הערה" },
    ],
  },
  {
    id: "money",
    label: "כסף",
    emoji: "💰",
    color: "#6366f1",
    bgColor: "#eef2ff",
    eventTypes: [
      { id: "payment", label: "תשלום", valueLabel: "סכום", unit: "₪" },
      { id: "income", label: "הכנסה", valueLabel: "סכום", unit: "₪" },
      { id: "debt", label: "חוב", valueLabel: "סכום + גוף", unit: "₪" },
      { id: "note", label: "הערה" },
    ],
  },
  {
    id: "task",
    label: "משימה",
    emoji: "📋",
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
    eventTypes: [
      { id: "done", label: "הושלם" },
      { id: "waiting", label: "ממתין", valueLabel: "ממתין ל..." },
      { id: "blocked", label: "תקוע", valueLabel: "מה חוסם" },
      { id: "note", label: "הערה" },
    ],
  },
  {
    id: "relationship",
    label: "אלי",
    emoji: "❤️",
    color: "#ef4444",
    bgColor: "#fef2f2",
    eventTypes: [
      { id: "conversation", label: "שיחה", valueLabel: "נושא" },
      { id: "conflict", label: "מתח", valueLabel: "נושא" },
      { id: "good_moment", label: "רגע טוב", valueLabel: "תיאור" },
      { id: "note", label: "הערה" },
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "לפני פחות מדקה";
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דקות`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`;
  return `לפני ${Math.floor(diff / 86400)} ימים`;
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

/** Traffic-light based on hours since last event */
function trafficLight(date: Date | string | null | undefined): { color: string; bg: string; dot: string; label: string } | null {
  if (!date) return null;
  const hours = (Date.now() - new Date(date).getTime()) / 3600000;
  if (hours < 3) return { color: "#059669", bg: "#d1fae5", dot: "#10b981", label: "עכשיו" };
  if (hours < 6) return { color: "#047857", bg: "#d1fae5", dot: "#10b981", label: `${Math.floor(hours)}שע` };
  if (hours < 12) return { color: "#d97706", bg: "#fef3c7", dot: "#f59e0b", label: `${Math.floor(hours)}שע` };
  if (hours < 24) return { color: "#b45309", bg: "#fef3c7", dot: "#f59e0b", label: `${Math.floor(hours)}שע` };
  const days = Math.floor(hours / 24);
  if (days < 3) return { color: "#dc2626", bg: "#fee2e2", dot: "#ef4444", label: `${days}ד` };
  return { color: "#991b1b", bg: "#fee2e2", dot: "#ef4444", label: `${days}ד` };
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "היום";
  if (d.toDateString() === yesterday.toDateString()) return "אתמול";
  return d.toLocaleDateString("he-IL");
}

// ─── TopicCard Component ──────────────────────────────────────────────────────

function TopicCard({ topic, onAdd }: { topic: Topic; onAdd: (topic: Topic) => void }) {
  const { data: lastLog } = trpc.dailyLogs.getLastByTopic.useQuery({ topic: topic.id });

  return (
    <button
      onClick={() => onAdd(topic)}
      className="w-full rounded-2xl p-4 text-right transition-all active:scale-95"
      style={{ backgroundColor: topic.bgColor, border: `2px solid ${topic.color}20` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: topic.color + "20" }}
        >
          {topic.emoji}
        </div>
        <div className="text-right">
          <div className="font-bold text-lg" style={{ color: topic.color }}>
            {topic.label}
          </div>
          {lastLog ? (
            (() => {
              const tl = trafficLight(lastLog.eventAt);
              return tl ? (
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5"
                  style={{ backgroundColor: tl.bg, color: tl.color }}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tl.dot }} />
                  {tl.label}
                </div>
              ) : null;
            })()
          ) : (
            <div className="text-xs text-gray-400">אין רשומות עדיין</div>
          )}
        </div>
      </div>
      {lastLog && (
        <div className="text-xs text-gray-600 bg-white/60 rounded-lg px-2 py-1 text-right">
          {lastLog.eventType} {lastLog.value ? `· ${lastLog.value}${lastLog.unit ? " " + lastLog.unit : ""}` : ""}
          {lastLog.notes ? ` · ${lastLog.notes.slice(0, 40)}` : ""}
        </div>
      )}
      <div
        className="mt-2 text-xs font-medium flex items-center gap-1 justify-end"
        style={{ color: topic.color }}
      >
        <span>+ הוסף</span>
      </div>
    </button>
  );
}

// ─── AddEntrySheet Component ──────────────────────────────────────────────────

function AddEntrySheet({
  topic,
  open,
  onClose,
  onSaved,
}: {
  topic: Topic | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [eventType, setEventType] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const createLog = trpc.dailyLogs.create.useMutation({
    onSuccess: () => {
      toast.success(`${topic?.label} — ${eventType} נשמר ✓`);
      setEventType("");
      setValue("");
      setNotes("");
      setTimerSeconds(0);
      setTimerRunning(false);
      onSaved();
      onClose();
    },
    onError: () => {
      toast.error("לא ניתן לשמור");
    },
  });

  // Timer
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const selectedEventConfig = topic?.eventTypes.find((e) => e.id === eventType);

  function handleSave() {
    if (!topic || !eventType) return;
    const finalValue = timerRunning || timerSeconds > 0
      ? String(Math.floor(timerSeconds / 60))
      : value;
    createLog.mutate({
      topic: topic.id,
      eventType,
      value: finalValue || undefined,
      unit: selectedEventConfig?.unit,
      notes: notes || undefined,
    });
  }

  function formatTimer(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  if (!topic) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8" dir="rtl">
        <SheetHeader className="text-right mb-4">
          <SheetTitle className="flex items-center gap-2 justify-end">
            <span>{topic.label}</span>
            <span className="text-2xl">{topic.emoji}</span>
          </SheetTitle>
        </SheetHeader>

        {/* Event Type Chips */}
        <div className="flex flex-wrap gap-2 justify-end mb-4">
          {topic.eventTypes.map((et) => (
            <button
              key={et.id}
              onClick={() => {
                setEventType(et.id);
                setTimerSeconds(0);
                setTimerRunning(false);
              }}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95"
              style={{
                backgroundColor: eventType === et.id ? topic.color : topic.bgColor,
                color: eventType === et.id ? "white" : topic.color,
                border: `1.5px solid ${topic.color}`,
              }}
            >
              {et.label}
            </button>
          ))}
        </div>

        {/* Timer (if applicable) */}
        {selectedEventConfig?.hasTimer && (
          <div className="flex items-center justify-center gap-4 mb-4 p-3 rounded-xl bg-gray-50">
            <div className="text-3xl font-mono font-bold" style={{ color: topic.color }}>
              {formatTimer(timerSeconds)}
            </div>
            <Button
              size="sm"
              onClick={() => setTimerRunning((r) => !r)}
              style={{ backgroundColor: topic.color }}
              className="text-white"
            >
              {timerRunning ? "עצור" : timerSeconds > 0 ? "המשך" : "התחל"}
            </Button>
            {timerSeconds > 0 && (
              <Button size="sm" variant="ghost" onClick={() => { setTimerSeconds(0); setTimerRunning(false); }}>
                אפס
              </Button>
            )}
          </div>
        )}

        {/* Value input */}
        {selectedEventConfig?.valueLabel && !selectedEventConfig.hasTimer && (
          <div className="mb-3">
            <label className="text-sm text-gray-600 block mb-1 text-right">
              {selectedEventConfig.valueLabel}
            </label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={selectedEventConfig.valueLabel}
              className="text-right"
              dir="rtl"
            />
          </div>
        )}

        {/* Notes */}
        <div className="mb-4">
          <label className="text-sm text-gray-600 block mb-1 text-right">הערות (אופציונלי)</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="הוסף הערה..."
            className="text-right resize-none"
            dir="rtl"
            rows={2}
          />
        </div>

        {/* Save Button */}
        <Button
          className="w-full h-12 text-base font-bold rounded-xl"
          style={{ backgroundColor: topic.color }}
          disabled={!eventType || createLog.isPending}
          onClick={handleSave}
        >
          {createLog.isPending ? "שומר..." : "שמור"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

// ─── Timeline View ────────────────────────────────────────────────────────────

function TimelineView({ filterTopic }: { filterTopic: string | null }) {
  const { data: logs, isLoading } = trpc.dailyLogs.list.useQuery({
    topic: filterTopic || undefined,
    limit: 50,
  });

  const topicMap = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-2">📝</div>
        <div>אין רשומות עדיין</div>
        <div className="text-sm mt-1">לחץ על כרטיס למעלה כדי להוסיף</div>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, typeof logs> = {};
  for (const log of logs) {
    const dateKey = formatDate(log.eventAt);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(log);
  }

  return (
    <div className="space-y-4 mt-4">
      {Object.entries(grouped).map(([date, dateLogs]) => (
        <div key={date}>
          <div className="text-xs font-semibold text-gray-400 mb-2 text-right">{date}</div>
          <div className="space-y-2">
            {dateLogs.map((log) => {
              const topic = topicMap[log.topic];
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: topic?.bgColor || "#f9fafb" }}
                  dir="rtl"
                >
                  <div className="text-xl mt-0.5">{topic?.emoji || "📌"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm" style={{ color: topic?.color }}>
                        {topic?.label || log.topic}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {log.eventType}
                      </Badge>
                      {log.value && (
                        <span className="text-sm text-gray-700">
                          {log.value}{log.unit ? " " + log.unit : ""}
                        </span>
                      )}
                    </div>
                    {log.notes && (
                      <div className="text-sm text-gray-600 mt-0.5 truncate">{log.notes}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTime(log.eventAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DailyTracker() {
  const { user, loading: authLoading } = useAuth();
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filterTopic, setFilterTopic] = useState<string | null>(null);
  const [view, setView] = useState<"cards" | "timeline">("cards");
  const utils = trpc.useUtils();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6" dir="rtl">
        <div className="text-4xl">📋</div>
        <h2 className="text-xl font-bold text-center">יומן מעקב יומי</h2>
        <p className="text-gray-500 text-center">התחבר כדי לעקוב אחרי הפעילויות היומיות שלך</p>
        <Button onClick={() => (window.location.href = getLoginUrl())}>
          התחבר
        </Button>
      </div>
    );
  }

  function handleAdd(topic: Topic) {
    setActiveTopic(topic);
    setSheetOpen(true);
  }

  function handleSaved() {
    utils.dailyLogs.list.invalidate();
    utils.dailyLogs.getLastByTopic.invalidate();
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setView("cards")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === "cards" ? "bg-purple-100 text-purple-700" : "text-gray-500"
              }`}
            >
              כרטיסים
            </button>
            <button
              onClick={() => setView("timeline")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === "timeline" ? "bg-purple-100 text-purple-700" : "text-gray-500"
              }`}
            >
              ציר זמן
            </button>
          </div>
          <h1 className="text-lg font-bold text-gray-800">יומן יומי</h1>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {view === "cards" ? (
          <>
            {/* Quick-entry cards grid */}
            <div className="grid grid-cols-2 gap-3">
              {TOPICS.map((topic) => (
                <TopicCard key={topic.id} topic={topic} onAdd={handleAdd} />
              ))}
            </div>

            {/* Recent timeline below cards */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-600">אחרון</div>
              </div>
              <TimelineView filterTopic={null} />
            </div>
          </>
        ) : (
          <>
            {/* Topic filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 flex-row-reverse">
              <button
                onClick={() => setFilterTopic(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterTopic === null ? "bg-gray-800 text-white" : "bg-white text-gray-600 border"
                }`}
              >
                הכל
              </button>
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setFilterTopic(filterTopic === topic.id ? null : topic.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95"
                  style={{
                    backgroundColor: filterTopic === topic.id ? topic.color : topic.bgColor,
                    color: filterTopic === topic.id ? "white" : topic.color,
                    border: `1.5px solid ${topic.color}40`,
                  }}
                >
                  {topic.emoji} {topic.label}
                </button>
              ))}
            </div>
            <TimelineView filterTopic={filterTopic} />
          </>
        )}
      </div>

      {/* Floating add button */}
      {view === "timeline" && (
        <button
          onClick={() => {
            setActiveTopic(TOPICS[0]);
            setSheetOpen(true);
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-purple-600 text-white rounded-full px-6 py-3 shadow-lg font-bold text-base active:scale-95 transition-transform"
        >
          + הוסף רשומה
        </button>
      )}

      {/* Entry Sheet */}
      <AddEntrySheet
        topic={activeTopic}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
