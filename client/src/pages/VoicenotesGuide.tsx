import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Mic, Copy, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Pattern {
  label: string;
  template: string;
  example: string;
  topic: string;
}

interface Section {
  id: string;
  title: string;
  emoji: string;
  color: string;
  intro: string;
  patterns: Pattern[];
}

// ─── Data ───────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "baby",
    title: "רני",
    emoji: "👶",
    color: "#f9a8d4",
    intro: "כדי שאפשר יהיה לשלוף מידע על רני, פתח כל הקלטה עם המילה 'רני' ואז הפעולה.",
    patterns: [
      {
        label: "האכלה",
        topic: "baby",
        template: "רני — האכלה — [כמות מ\"ל] — [שעה]",
        example: "רני — האכלה — 90 מ\"ל — שתיים בצהריים",
      },
      {
        label: "שינה",
        topic: "baby",
        template: "רני — שינה — [שעת התחלה] עד [שעת סיום]",
        example: "רני — שינה — אחת בצהריים עד שלוש",
      },
      {
        label: "חיתול",
        topic: "baby",
        template: "רני — חיתול — [סוג: רטוב / מלוכלך] — [שעה]",
        example: "רני — חיתול — מלוכלך — עשר בבוקר",
      },
      {
        label: "בריאות / תסמין",
        topic: "baby",
        template: "רני — בריאות — [מה שמתי לב] — [מה עשיתי]",
        example: "רני — בריאות — פטרת בלשון — שמתי תרופה",
      },
      {
        label: "תור / רופא",
        topic: "baby",
        template: "רני — תור — [שם רופא] — [תאריך] — [מה נאמר]",
        example: "רני — תור — ד\"ר לוי — חמישה ביולי — אמר שהכל בסדר",
      },
    ],
  },
  {
    id: "dog",
    title: "פיצ'",
    emoji: "🐕",
    color: "#fcd34d",
    intro: "פתח כל הקלטה על פיצ' עם 'פיצ' — [פעולה]' כדי שאפשר יהיה לשלוף.",
    patterns: [
      {
        label: "האכלה",
        topic: "dog",
        template: "פיצ' — האכלה — [כמות גרם] — [שעה]",
        example: "פיצ' — האכלה — 150 גרם — שבע בבוקר",
      },
      {
        label: "טיול",
        topic: "dog",
        template: "פיצ' — טיול — [כמה זמן] — [איפה]",
        example: "פיצ' — טיול — עשרים דקות — פארק",
      },
      {
        label: "תרופה",
        topic: "dog",
        template: "פיצ' — תרופה — [שם תרופה] — [מינון]",
        example: "פיצ' — תרופה — נגד פרעושים — גלולה אחת",
      },
      {
        label: "וטרינר",
        topic: "dog",
        template: "פיצ' — וטרינר — [תאריך] — [מה נאמר]",
        example: "פיצ' — וטרינר — שלישי — חיסון שנתי בסדר",
      },
    ],
  },
  {
    id: "money",
    title: "כסף",
    emoji: "💰",
    color: "#6ee7b7",
    intro: "כל הקלטה כספית צריכה להכיל: גורם + סכום + סטטוס.",
    patterns: [
      {
        label: "חוב / תשלום",
        topic: "money",
        template: "כסף — [גורם] — חוב — [סכום] ₪ — [סטטוס]",
        example: "כסף — ביטוח לאומי — חוב — 823 ₪ — עדיין פתוח",
      },
      {
        label: "פיצויים / זכאות",
        topic: "money",
        template: "כסף — פיצויים — [גורם] — [סטטוס] — [מה עשיתי]",
        example: "כסף — פיצויים — מעסיק ישן — תקוע — שלחתי מייל",
      },
      {
        label: "הכנסה",
        topic: "money",
        template: "כסף — הכנסה — [מקור] — [סכום] ₪ — [תאריך]",
        example: "כסף — הכנסה — ביטוח לאומי — 2,400 ₪ — ראשון לחודש",
      },
      {
        label: "הוצאה",
        topic: "money",
        template: "כסף — הוצאה — [מה] — [סכום] ₪",
        example: "כסף — הוצאה — קניות שבועיות — 340 ₪",
      },
    ],
  },
  {
    id: "health",
    title: "בריאות",
    emoji: "💊",
    color: "#93c5fd",
    intro: "הקלטות בריאות: תרופה + מינון + שעה. תסמין + מה עשית.",
    patterns: [
      {
        label: "תרופה",
        topic: "health",
        template: "בריאות — תרופה — [שם] — [מינון] — [שעה]",
        example: "בריאות — תרופה — אטנט — 18 מ\"ג — שמונה בבוקר",
      },
      {
        label: "תסמין",
        topic: "health",
        template: "בריאות — תסמין — [מה] — [עוצמה 1-10] — [מה עשיתי]",
        example: "בריאות — תסמין — כאב ראש — 6 — לקחתי אקמול",
      },
      {
        label: "תור",
        topic: "health",
        template: "בריאות — תור — [שם רופא] — [תאריך] — [מה נאמר]",
        example: "בריאות — תור — ד\"ר כהן — שבעה ביולי — המשך טיפול",
      },
      {
        label: "ועדה / תביעה",
        topic: "health",
        template: "בריאות — תביעה — [גורם] — [סטטוס] — [מה עשיתי]",
        example: "בריאות — תביעה — ביטוח לאומי — שלב ב — שלחתי מסמכים",
      },
    ],
  },
  {
    id: "people",
    title: "אנשים",
    emoji: "👥",
    color: "#c4b5fd",
    intro: "כל שיחה עם אדם: שם + סוג + מה קרה + מה הצעד הבא.",
    patterns: [
      {
        label: "שיחה",
        topic: "people",
        template: "אנשים — [שם] — שיחה — [נושא] — [מה הוחלט]",
        example: "אנשים — אלי — שיחה — ניקיון הבית — הסכמנו לחלק משימות",
      },
      {
        label: "מריבה / מתח",
        topic: "people",
        template: "אנשים — [שם] — מתח — [מה קרה] — [איך הרגשתי]",
        example: "אנשים — אלי — מתח — לא הקשיבה — כועס ועצוב",
      },
      {
        label: "גורם רשמי",
        topic: "people",
        template: "אנשים — [גורם] — שיחה — [נושא] — [מה נאמר] — [צעד הבא]",
        example: "אנשים — ביטוח לאומי — שיחה — חוב 823 — אמרו לשלוח טופס — לשלוח עד יום ה",
      },
      {
        label: "רופא",
        topic: "people",
        template: "אנשים — ד\"ר [שם] — תור — [תאריך] — [הנחיות]",
        example: "אנשים — ד\"ר לוי — תור — שלישי — לקחת תרופה פעמיים ביום",
      },
    ],
  },
  {
    id: "tasks",
    title: "משימות",
    emoji: "📋",
    color: "#fca5a5",
    intro: "כל משימה: מה + עד מתי + מה תקוע.",
    patterns: [
      {
        label: "משימה חדשה",
        topic: "tasks",
        template: "משימה — [מה] — עד [תאריך] — [מה צריך]",
        example: "משימה — לשלוח טופס ביטוח לאומי — עד יום חמישי — צריך תעודת זהות",
      },
      {
        label: "משימה תקועה",
        topic: "tasks",
        template: "משימה תקועה — [מה] — תקוע כי [סיבה] — [מה עוזר]",
        example: "משימה תקועה — לסדר מחסן — תקוע כי אין מקום — צריך ארגז",
      },
      {
        label: "הושלם",
        topic: "tasks",
        template: "הושלם — [מה] — [תאריך]",
        example: "הושלם — שלחתי מסמכים לביטוח לאומי — היום",
      },
    ],
  },
];

// ─── Copy Button ────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("הועתק!");
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} className="flex-shrink-0 text-muted-foreground active:scale-95 transition-transform">
      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

// ─── Pattern Card ───────────────────────────────────────────────────────────

function PatternCard({ pattern }: { pattern: Pattern }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {pattern.label}
      </div>
      {/* Template */}
      <div className="flex items-start justify-between gap-2 bg-muted rounded-lg px-3 py-2">
        <div className="text-sm font-mono text-foreground leading-relaxed">{pattern.template}</div>
        <CopyButton text={pattern.template} />
      </div>
      {/* Example */}
      <div className="text-xs text-muted-foreground pr-1">
        <span className="font-medium">דוגמה: </span>
        <span className="italic">{pattern.example}</span>
      </div>
    </div>
  );
}

// ─── Section ────────────────────────────────────────────────────────────────

function SectionBlock({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ borderRightColor: section.color, borderRightWidth: 4 }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-right"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{section.emoji}</span>
          <div>
            <div className="font-semibold">{section.title}</div>
            <div className="text-xs text-muted-foreground">{section.patterns.length} תבניות</div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border p-3 space-y-3">
          <div className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
            💡 {section.intro}
          </div>
          {section.patterns.map((p, i) => (
            <PatternCard key={i} pattern={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function VoicenotesGuide() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">מדריך Voicenotes</h1>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 px-1">
          איך לנסח הקלטות כדי שאפשר יהיה לשלוף מידע אחר כך
        </p>
      </div>

      {/* Tip banner */}
      <div className="mx-4 mt-4 bg-primary/10 border border-primary/20 rounded-xl p-3">
        <div className="text-sm font-semibold text-primary mb-1">🎯 הכלל הכי חשוב</div>
        <div className="text-sm text-foreground">
          פתח כל הקלטה עם <strong>נושא — פעולה</strong>.<br />
          לא "היום עשיתי..." — אלא <strong>"רני — האכלה"</strong> או <strong>"כסף — חוב"</strong>.
        </div>
      </div>

      {/* Sections */}
      <div className="p-4 space-y-3">
        {SECTIONS.map((s) => (
          <SectionBlock key={s.id} section={s} />
        ))}
      </div>

      {/* Bottom tip */}
      <div className="mx-4 mb-6 bg-muted rounded-xl p-3">
        <div className="text-xs text-muted-foreground text-center">
          💡 לאחר הקלטה — תייג ב-Voicenotes עם הנושא הנכון (רני / פיצ' / כסף / בריאות)
        </div>
      </div>
    </div>
  );
}
