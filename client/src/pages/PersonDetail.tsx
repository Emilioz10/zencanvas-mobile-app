import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowRight, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 2) return "עכשיו";
  if (diffMin < 60) return `לפני ${diffMin} דקות`;
  if (diffHr < 24) return `לפני ${diffHr} שעות`;
  if (diffDay === 1) return "אתמול";
  if (diffDay < 7) return `לפני ${diffDay} ימים`;
  return new Date(date).toLocaleDateString("he-IL");
}

// Must match the enum in people router
const INTERACTION_TYPES = [
  { id: "talk" as const, label: "שיחה", emoji: "💬" },
  { id: "message" as const, label: "הודעה", emoji: "✉️" },
  { id: "meeting" as const, label: "פגישה", emoji: "🤝" },
  { id: "argument" as const, label: "מתח/ריב", emoji: "⚡" },
  { id: "good_moment" as const, label: "רגע טוב", emoji: "❤️" },
  { id: "appointment" as const, label: "תור רשמי", emoji: "📅" },
  { id: "payment" as const, label: "תשלום", emoji: "💰" },
  { id: "task_done" as const, label: "משימה הושלמה", emoji: "✅" },
  { id: "task_pending" as const, label: "משימה ממתינה", emoji: "⏳" },
];

function scoreColor(score: number): string {
  if (score >= 4) return "#10b981";
  if (score >= 3) return "#f59e0b";
  return "#ef4444";
}

// ─── Log Interaction Sheet ─────────────────────────────────────────────────

function LogInteractionSheet({
  personId,
  open,
  onClose,
}: {
  personId: number;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [type, setType] = useState<typeof INTERACTION_TYPES[number]["id"]>("talk");
  const [score, setScore] = useState(3);
  const [note, setNote] = useState("");

  const logMutation = trpc.people.logInteraction.useMutation({
    onSuccess: () => {
      utils.people.get.invalidate({ personId });
      utils.people.list.invalidate();
      toast.success("נרשם ✓");
      setNote("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedType = INTERACTION_TYPES.find((t) => t.id === type);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8" dir="rtl">
        <SheetHeader className="mb-4">
          <SheetTitle>רשום אינטראקציה</SheetTitle>
        </SheetHeader>

        {/* Type picker */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">מה קרה?</div>
          <div className="grid grid-cols-5 gap-2">
            {INTERACTION_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                  type === t.id ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="text-xs text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">איך היה? (1-5)</div>
          <div className="flex gap-3 justify-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setScore(s)}
                className="transition-transform active:scale-90"
              >
                <Star
                  className="w-8 h-8"
                  fill={s <= score ? scoreColor(score) : "transparent"}
                  stroke={s <= score ? scoreColor(score) : "#9ca3af"}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">הערה (אופציונלי)</div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="מה קרה? מה אמרנו? מה הוחלט?"
            className="text-right resize-none"
            dir="rtl"
            rows={2}
          />
        </div>

        <Button
          className="w-full"
          disabled={logMutation.isPending}
          onClick={() =>
            logMutation.mutate({
              personId,
              type,
              score,
              note: note || undefined,
            })
          }
        >
          {logMutation.isPending ? "שומר..." : `${selectedType?.emoji} שמור`}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PersonDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const personId = parseInt(params.id ?? "0");
  const [showLog, setShowLog] = useState(false);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.people.get.useQuery({ personId });

  const deleteMutation = trpc.people.delete.useMutation({
    onSuccess: () => {
      utils.people.list.invalidate();
      navigate("/people");
      toast.success("נמחק");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">לא נמצא</p>
          <Button onClick={() => navigate("/people")}>חזור</Button>
        </div>
      </div>
    );
  }

  const { person, interactions } = data;
  const color = person.color ?? "#6b7280";
  const avgScore =
    interactions.length > 0
      ? interactions.reduce((sum, i) => sum + (i.score ?? 3), 0) / interactions.length
      : 3;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div
        className="px-4 pt-4 pb-6"
        style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)` }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/people")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`למחוק את ${person.name}?`))
                deleteMutation.mutate({ personId });
            }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-5xl">{person.avatar ?? "👤"}</div>
          <div>
            <h1 className="text-2xl font-bold">{person.name}</h1>
            {person.phone && (
              <a href={`tel:${person.phone}`} className="text-sm text-primary underline">
                {person.phone}
              </a>
            )}
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-4 h-4"
                  fill={s <= Math.round(avgScore) ? scoreColor(avgScore) : "transparent"}
                  stroke={scoreColor(avgScore)}
                />
              ))}
              <span className="text-xs text-muted-foreground mr-1">
                ({interactions.length} אינטראקציות)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Log button */}
      <div className="px-4 -mt-3 mb-4">
        <Button
          className="w-full shadow-lg"
          onClick={() => setShowLog(true)}
          style={{ backgroundColor: color }}
        >
          <Plus className="w-4 h-4 ml-2" />
          רשום אינטראקציה עכשיו
        </Button>
      </div>

      {/* Interaction timeline */}
      <div className="px-4 pb-8">
        <h2 className="font-semibold text-sm text-muted-foreground mb-3">היסטוריה</h2>

        {interactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">אין אינטראקציות עדיין</p>
            <p className="text-xs mt-1">לחץ על הכפתור למעלה כדי לרשום</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interactions.map((interaction) => {
              const t = INTERACTION_TYPES.find((x) => x.id === interaction.type);
              return (
                <div
                  key={interaction.id}
                  className="flex gap-3 rounded-xl bg-card border border-border p-3"
                >
                  <div className="text-2xl flex-shrink-0">{t?.emoji ?? "💬"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{t?.label ?? interaction.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(interaction.happenedAt)}
                      </span>
                    </div>
                    {interaction.score !== null && (
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className="w-3 h-3"
                            fill={
                              s <= (interaction.score ?? 0)
                                ? scoreColor(interaction.score ?? 0)
                                : "transparent"
                            }
                            stroke={scoreColor(interaction.score ?? 0)}
                          />
                        ))}
                      </div>
                    )}
                    {interaction.note && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {interaction.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <LogInteractionSheet
        personId={personId}
        open={showLog}
        onClose={() => setShowLog(false)}
      />
    </div>
  );
}
