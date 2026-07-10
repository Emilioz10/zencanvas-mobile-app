import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Plus, Users, Clock, Star } from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(date: Date | string | null): string {
  if (!date) return "אף פעם";
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
  if (diffDay < 30) return `לפני ${Math.floor(diffDay / 7)} שבועות`;
  return `לפני ${Math.floor(diffDay / 30)} חודשים`;
}

/** Traffic-light: returns color + label based on days since last contact */
function trafficLight(date: Date | string | null): { color: string; bg: string; dot: string; label: string } {
  if (!date) return { color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af", label: "אף פעם" };
  const days = (Date.now() - new Date(date).getTime()) / 86400000;
  if (days < 1) return { color: "#059669", bg: "#d1fae5", dot: "#10b981", label: "היום" };
  if (days < 3) return { color: "#047857", bg: "#d1fae5", dot: "#10b981", label: `לפני ${Math.floor(days)} ימים` };
  if (days < 7) return { color: "#d97706", bg: "#fef3c7", dot: "#f59e0b", label: `לפני ${Math.floor(days)} ימים` };
  if (days < 14) return { color: "#b45309", bg: "#fef3c7", dot: "#f59e0b", label: `לפני ${Math.floor(days)} ימים` };
  if (days < 30) return { color: "#dc2626", bg: "#fee2e2", dot: "#ef4444", label: `לפני ${Math.floor(days / 7)} שבועות` };
  return { color: "#991b1b", bg: "#fee2e2", dot: "#ef4444", label: `לפני ${Math.floor(days / 30)} חודשים` };
}

function scoreColor(score: number): string {
  if (score >= 4) return "#10b981";
  if (score >= 3) return "#f59e0b";
  return "#ef4444";
}

const RELATION_LABELS: Record<string, string> = {
  family: "👨‍👩‍👧 משפחה",
  partner: "❤️ פרטנר",
  friend: "👫 חבר",
  doctor: "🩺 רופא",
  official: "🏛️ גורם רשמי",
  work: "💼 עבודה",
  other: "👤 אחר",
};

const RELATION_COLORS: Record<string, string> = {
  family: "#f59e0b",
  partner: "#ef4444",
  friend: "#10b981",
  doctor: "#3b82f6",
  official: "#6366f1",
  work: "#8b5cf6",
  other: "#6b7280",
};

const AVATAR_OPTIONS = ["👤", "👨", "👩", "👴", "👵", "👶", "🧑", "🐕", "🏛️", "🩺", "💼"];

// ─── Add Person Dialog ─────────────────────────────────────────────────────

function AddPersonDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("👤");
  const [relType, setRelType] = useState<string>("other");
  const [phone, setPhone] = useState("");

  const createMutation = trpc.people.create.useMutation({
    onSuccess: () => {
      utils.people.list.invalidate();
      toast.success(`${name} נוסף/ה`);
      setName(""); setAvatar("👤"); setRelType("other"); setPhone("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>הוסף אדם</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Avatar picker */}
          <div>
            <div className="text-sm font-medium mb-2">אווטר</div>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`text-2xl p-2 rounded-lg transition-colors ${
                    avatar === a ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">שם</div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם האדם"
              className="text-right"
              dir="rtl"
            />
          </div>

          <div>
            <div className="text-sm font-medium mb-1">סוג קשר</div>
            <Select value={relType} onValueChange={setRelType}>
              <SelectTrigger dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RELATION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">טלפון (אופציונלי)</div>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05X-XXXXXXX"
              type="tel"
              dir="ltr"
            />
          </div>

          <Button
            className="w-full"
            disabled={!name.trim() || createMutation.isPending}
            onClick={() =>
              createMutation.mutate({
                name: name.trim(),
                avatar,
                relationshipType: relType as any,
                phone: phone || undefined,
                color: RELATION_COLORS[relType] ?? "#6b7280",
              })
            }
          >
            {createMutation.isPending ? "שומר..." : "הוסף"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Person Card ───────────────────────────────────────────────────────────

function PersonCard({
  person,
  onClick,
}: {
  person: {
    id: number;
    name: string;
    avatar: string | null;
    color: string | null;
    relationshipType: string | null;
    lastInteraction: { happenedAt: Date | string; score: number | null } | null;
    totalInteractions: number;
    avgScore: number;
  };
  onClick: () => void;
}) {
  const color = person.color ?? RELATION_COLORS[person.relationshipType ?? "other"] ?? "#6b7280";
  const lastDate = person.lastInteraction?.happenedAt ?? null;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-4 text-right flex flex-col gap-2 active:scale-95 transition-transform"
      style={{ borderRightColor: color, borderRightWidth: 4 }}
    >
      <div className="flex items-center justify-between">
        <div className="text-3xl">{person.avatar ?? "👤"}</div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className="w-3 h-3"
              fill={s <= Math.round(person.avgScore) ? scoreColor(person.avgScore) : "transparent"}
              stroke={scoreColor(person.avgScore)}
            />
          ))}
        </div>
      </div>

      <div className="font-semibold text-sm">{person.name}</div>

      <Badge
        variant="secondary"
        className="text-xs w-fit"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {RELATION_LABELS[person.relationshipType ?? "other"]}
      </Badge>

      <div className="flex items-center justify-between mt-1">
        {/* Traffic-light badge */}
        {(() => {
          const tl = trafficLight(lastDate);
          return (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: tl.bg, color: tl.color }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: tl.dot }}
              />
              {tl.label}
            </div>
          );
        })()}
        <div className="text-xs text-muted-foreground">{person.totalInteractions} פגישות</div>
      </div>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PeopleHub() {
  const [, navigate] = useLocation();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const { data: people = [], isLoading } = trpc.people.list.useQuery();

  const filtered = people.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: people with no recent contact first (most overdue)
  const sorted = [...filtered].sort((a, b) => {
    const aDate = a.lastInteraction?.happenedAt ? new Date(a.lastInteraction.happenedAt).getTime() : 0;
    const bDate = b.lastInteraction?.happenedAt ? new Date(b.lastInteraction.happenedAt).getTime() : 0;
    return aDate - bDate; // oldest first
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">אנשים</h1>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 ml-1" />
            הוסף
          </Button>
        </div>

        <div className="relative">
          <Input
            className="pr-4 text-right"
            placeholder="חפש אדם..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            dir="rtl"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium mb-2">אין אנשים עדיין</p>
            <p className="text-sm mb-6">הוסף אנשים חשובים בחייך</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 ml-1" />
              הוסף אדם ראשון
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sorted.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onClick={() => navigate(`/people/${person.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <AddPersonDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
