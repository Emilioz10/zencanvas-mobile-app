import { useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Zap, ChevronLeft, X, CheckCircle2, Circle } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Step {
  icon: string;
  text: string;
  detail?: string;
  duration?: string; // e.g. "30 שניות"
}

interface Skill {
  id: string;
  title: string;
  emoji: string;
  color: string;
  category: "home" | "baby" | "dog" | "health" | "money" | "communication" | "self";
  categoryLabel: string;
  duration: string; // total estimated time
  difficulty: "קל" | "בינוני" | "קשה";
  steps: Step[];
}

// ─── Skills Data ────────────────────────────────────────────────────────────

const SKILLS: Skill[] = [
  {
    id: "dishes",
    title: "שטיפת כלים",
    emoji: "🍽️",
    color: "#0ea5e9",
    category: "home",
    categoryLabel: "🏠 בית",
    duration: "10-15 דקות",
    difficulty: "קל",
    steps: [
      { icon: "🪣", text: "מלא את הכיור במים חמים", detail: "טמפרטורה נסבלת לידיים", duration: "30 שניות" },
      { icon: "🧴", text: "הוסף כמה טיפות נוזל כלים", detail: "לא יותר מדי — יוצר קצף מיותר" },
      { icon: "🥄", text: "שים כלים קטנים ראשונה", detail: "כפות, מזלגות, סכינים" },
      { icon: "🧽", text: "שפשף עם ספוג מהפנים החוצה", detail: "כוסות: בפנים → בחוץ → שפה" },
      { icon: "🍳", text: "סירים ומחבתות — בסוף", detail: "השרה 5 דקות אם יש שאריות" },
      { icon: "🚿", text: "שטוף עם מים קרים", detail: "מים קרים מסירים סבון טוב יותר" },
      { icon: "🏗️", text: "הנח על מייבש כלים", detail: "פנים כלפי מטה לניקוז" },
    ],
  },
  {
    id: "baby-feeding",
    title: "האכלת רני",
    emoji: "👶",
    color: "#f59e0b",
    category: "baby",
    categoryLabel: "👶 רני",
    duration: "20-30 דקות",
    difficulty: "בינוני",
    steps: [
      { icon: "🧼", text: "שטוף ידיים", detail: "לפחות 20 שניות", duration: "20 שניות" },
      { icon: "🍼", text: "הכן בקבוק: 90 מ\"ל מים", detail: "מים מינרליים או מסוננים" },
      { icon: "🌡️", text: "חמם מים ל-40°C", detail: "בדוק עם מדחום — לא יותר!" },
      { icon: "🥛", text: "הוסף 3 כפות מדידה אבקה", detail: "12 גרם = 3 כפות שטוחות" },
      { icon: "🔄", text: "ערבב עד שנמס לגמרי", detail: "אל תנער חזק — יוצר בועות" },
      { icon: "✋", text: "בדוק טמפרטורה על פנים כף יד", detail: "אמור להרגיש חמים-נעים, לא חם" },
      { icon: "🤱", text: "האכל בזווית 45°", detail: "ראש גבוה מגוף, בקבוק מוטה" },
      { icon: "⏱️", text: "המתן 15-20 דקות", detail: "אל תמהר — שאיפה גורמת לגזים" },
      { icon: "🫁", text: "גרגר — הרם על כתף", detail: "טפח בעדינות על הגב 2-3 דקות" },
    ],
  },
  {
    id: "dog-walk",
    title: "טיול עם פיצ'",
    emoji: "🐕",
    color: "#10b981",
    category: "dog",
    categoryLabel: "🐕 פיצ'",
    duration: "20-30 דקות",
    difficulty: "קל",
    steps: [
      { icon: "🦮", text: "קח רצועה + שקיות ניקיון", detail: "תמיד 2-3 שקיות" },
      { icon: "💧", text: "קח בקבוק מים לפיצ'", detail: "בקיץ חובה" },
      { icon: "🔒", text: "בדוק שהקולר מהודק", detail: "צריך להכנס 2 אצבעות" },
      { icon: "🚶", text: "צא מהדלת — פיצ' אחריך", detail: "לא לפניך — חשוב לסמכות" },
      { icon: "🌳", text: "הנח לו להריח בחופשיות", detail: "20-30 דקות הרחה = שעת שינה" },
      { icon: "💩", text: "אסוף מיד עם שקית", detail: "הפוך שקית על יד, אסוף, הפוך חזרה" },
      { icon: "🏠", text: "חזור הביתה — פיצ' נכנס אחרון", detail: "אתה נכנס ראשון" },
      { icon: "🍶", text: "תן מים לפיצ' מיד בכניסה", detail: "קערה מלאה" },
    ],
  },
  {
    id: "laundry",
    title: "כביסה",
    emoji: "👕",
    color: "#8b5cf6",
    category: "home",
    categoryLabel: "🏠 בית",
    duration: "2-3 שעות (כולל ייבוש)",
    difficulty: "קל",
    steps: [
      { icon: "🗂️", text: "מיין: לבן / צבעוני / כהה", detail: "אל תערבב לבן עם צבעוני!" },
      { icon: "🔍", text: "בדוק כיסים", detail: "רקמות, מטבעות, אוזניות" },
      { icon: "🔄", text: "הפוך ג'ינסים וחולצות כהות", detail: "שומר על הצבע" },
      { icon: "🧴", text: "הוסף אבקת כביסה", detail: "לפי הוראות — לא יותר!" },
      { icon: "🌡️", text: "בחר טמפרטורה: 30° לרגיל, 60° למגבות", detail: "בגדי תינוק: 60°" },
      { icon: "▶️", text: "הפעל מכונה", detail: "מחזור רגיל: 1:30 שעות" },
      { icon: "⏰", text: "הוצא מיד כשנגמר", detail: "אל תשאיר — מתעפש" },
      { icon: "📌", text: "תלה מיד — אל תקפל לח", detail: "מחלק על מייבש או חבל" },
    ],
  },
  {
    id: "medication",
    title: "לקיחת תרופות",
    emoji: "💊",
    color: "#ef4444",
    category: "health",
    categoryLabel: "💊 בריאות",
    duration: "2 דקות",
    difficulty: "קל",
    steps: [
      { icon: "⏰", text: "בדוק שעה — האם זמן התרופה?", detail: "אטנט: בוקר עם אוכל" },
      { icon: "🍽️", text: "אכל משהו קטן קודם", detail: "לא על בטן ריקה" },
      { icon: "💊", text: "קח את הכמות הנכונה", detail: "בדוק על הקופסה" },
      { icon: "💧", text: "שתה כוס מים מלאה", detail: "לא מיץ — מים בלבד" },
      { icon: "✅", text: "סמן שלקחת", detail: "ביומן / אפליקציה" },
    ],
  },
  {
    id: "phone-call-official",
    title: "שיחה עם גורם רשמי",
    emoji: "📞",
    color: "#6366f1",
    category: "communication",
    categoryLabel: "📞 תקשורת",
    duration: "30-60 דקות",
    difficulty: "קשה",
    steps: [
      { icon: "📝", text: "כתוב מה אתה רוצה לדעת/לקבל", detail: "שאלה אחת ברורה לפני שמתקשר" },
      { icon: "📋", text: "הכן תעודת זהות + מסמכים רלוונטיים", detail: "תמיד שואלים ת.ז." },
      { icon: "🎙️", text: "הכן Voicenotes להקלטה", detail: "תמיד תקליט — לא תזכור" },
      { icon: "📞", text: "התקשר — אמור שמך + ת.ז. בהתחלה", detail: "\"שמי X, ת.ז. XXXXXXX\"" },
      { icon: "🗣️", text: "שאל את השאלה הספציפית שלך", detail: "אל תסביר יותר מדי" },
      { icon: "✍️", text: "כתוב: שם הנציג + מה נאמר + מספר פנייה", detail: "חשוב לתביעות עתידיות" },
      { icon: "🔁", text: "חזור על מה שהבנת לנציג", detail: "\"אז מה שאמרת זה...\"" },
      { icon: "📧", text: "בקש אישור בכתב / במייל", detail: "\"אפשר לקבל את זה בכתב?\"" },
    ],
  },
  {
    id: "grocery",
    title: "קניות סופרמרקט",
    emoji: "🛒",
    color: "#f97316",
    category: "home",
    categoryLabel: "🏠 בית",
    duration: "30-45 דקות",
    difficulty: "בינוני",
    steps: [
      { icon: "📋", text: "בדוק מה חסר לפני יציאה", detail: "מקרר + מזווה + שירותים" },
      { icon: "📱", text: "פתח רשימת קניות", detail: "Google Keep / WhatsApp לעצמך" },
      { icon: "🧺", text: "קח שקיות מהבית", detail: "3-4 שקיות בדרך כלל מספיקות" },
      { icon: "🥦", text: "התחל מירקות ופירות", detail: "מסוף החנות לתחילתה" },
      { icon: "🥛", text: "מוצרי חלב — לקראת הסוף", detail: "שמור קר כמה שאפשר" },
      { icon: "❄️", text: "קפואים — אחרון לפני קופה", detail: "שמור קר עד הבית" },
      { icon: "🧾", text: "שמור קבלה", detail: "לבדיקת חיובים בכרטיס" },
    ],
  },
  {
    id: "sleep-routine",
    title: "שגרת שינה",
    emoji: "😴",
    color: "#1d4ed8",
    category: "self",
    categoryLabel: "🧘 עצמי",
    duration: "30 דקות לפני שינה",
    difficulty: "בינוני",
    steps: [
      { icon: "📵", text: "סגור מסכים שעה לפני", detail: "מסך = מוח ער" },
      { icon: "💊", text: "קח תרופות ערב אם יש", detail: "בדוק רשימה" },
      { icon: "🦷", text: "צחצח שיניים + שטוף פנים", detail: "2 דקות צחצוח" },
      { icon: "🌡️", text: "חדר קריר — 18-20°", detail: "שינה טובה יותר בקור" },
      { icon: "🌑", text: "חושך מלא או מסכת עיניים", detail: "מלטונין מופרש בחושך" },
      { icon: "📱", text: "טלפון על שקט + מרחק יד", detail: "לא על הראש — רק להשכמה" },
    ],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  home: "🏠 בית",
  baby: "👶 רני",
  dog: "🐕 פיצ'",
  health: "💊 בריאות",
  money: "💰 כסף",
  communication: "📞 תקשורת",
  self: "🧘 עצמי",
};

// ─── Step Runner Component ──────────────────────────────────────────────────

function StepRunner({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const step = skill.steps[currentStep];
  const isLast = currentStep === skill.steps.length - 1;
  const allDone = completed.size === skill.steps.length;

  const toggleComplete = (i: number) => {
    const next = new Set(completed);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setCompleted(next);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-lg font-bold">{skill.emoji} {skill.title}</div>
          <div className="text-xs text-muted-foreground">
            שלב {currentStep + 1} מתוך {skill.steps.length}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{skill.duration}</div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentStep + 1) / skill.steps.length) * 100}%` }}
        />
      </div>

      {/* Current step */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-7xl mb-6">{step.icon}</div>
        <div className="text-2xl font-bold mb-3">{step.text}</div>
        {step.detail && (
          <div className="text-muted-foreground text-base bg-muted rounded-xl px-4 py-3">
            {step.detail}
          </div>
        )}
        {step.duration && (
          <div className="mt-3 text-sm text-primary font-medium">⏱️ {step.duration}</div>
        )}
      </div>

      {/* Step list overview */}
      <div className="border-t border-border px-4 py-2 max-h-32 overflow-y-auto">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {skill.steps.map((s, i) => (
            <button
              key={i}
              onClick={() => { setCurrentStep(i); toggleComplete(i); }}
              className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                i === currentStep
                  ? "bg-primary/10 border border-primary"
                  : completed.has(i)
                  ? "bg-green-500/10 border border-green-500/30"
                  : "bg-muted"
              }`}
            >
              <span className="text-xl">{s.icon}</span>
              {completed.has(i) ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : (
                <Circle className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 flex gap-3">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-medium disabled:opacity-30"
        >
          ← הקודם
        </button>
        {allDone ? (
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-green-500 text-white text-sm font-bold"
          >
            ✅ סיימתי!
          </button>
        ) : (
          <button
            onClick={() => {
              toggleComplete(currentStep);
              if (!isLast) setCurrentStep(currentStep + 1);
            }}
            className="flex-1 py-3 rounded-xl text-sm font-bold"
            style={{ backgroundColor: skill.color, color: "white" }}
          >
            {isLast ? "סיים ✓" : "הבא →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SkillsIndex() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);

  const filtered = SKILLS.filter((s) => {
    const matchesSearch =
      !search ||
      s.title.includes(search) ||
      s.steps.some((step) => step.text.includes(search));
    const matchesCategory = !selectedCategory || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(SKILLS.map((s) => s.category)));

  if (activeSkill) {
    return <StepRunner skill={activeSkill} onClose={() => setActiveSkill(null)} />;
  }

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
            <Zap className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">מה אני יודע לעשות</h1>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pr-9 text-right"
            placeholder="חפש פעולה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            הכל
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Skill grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {filtered.map((skill) => (
          <button
            key={skill.id}
            onClick={() => setActiveSkill(skill)}
            className="rounded-xl border border-border bg-card p-4 text-right flex flex-col gap-2 active:scale-95 transition-transform"
            style={{ borderTopColor: skill.color, borderTopWidth: 3 }}
          >
            <div className="text-3xl">{skill.emoji}</div>
            <div className="font-semibold text-sm leading-tight">{skill.title}</div>
            <div className="flex items-center justify-between mt-auto">
              <Badge
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: `${skill.color}20`, color: skill.color }}
              >
                {skill.difficulty}
              </Badge>
              <span className="text-xs text-muted-foreground">{skill.steps.length} שלבים</span>
            </div>
            <div className="text-xs text-muted-foreground">⏱️ {skill.duration}</div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>לא נמצאו כישורים</p>
          </div>
        )}
      </div>
    </div>
  );
}
