/**
 * DailyBrain — המוח היומי
 *
 * מסך ה"עכשיו" — מה הדבר הבא הפיזי שצריך לעשות.
 * מבוסס על הקשר אמיתי:
 * - 3 הדברים החשובים ביותר להיום
 * - לוח זמנים לפיצ' (כלב)
 * - תזכורת תרופות
 * - רני (תינוק)
 * - כפתור "עכשיו" — מה הצעד הבא הפיזי
 * - הוספת הערה קולית (transcription)
 */

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── נתונים ──────────────────────────────────────────────────────────────────

interface DogEvent {
  time: string;
  label: string;
  done: boolean;
}

const DOG_SCHEDULE_DEFAULT: DogEvent[] = [
  { time: "07:00", label: "יציאה בוקר — פיצ'", done: false },
  { time: "13:00", label: "יציאה צהריים — פיצ'", done: false },
  { time: "19:00", label: "יציאה ערב — פיצ'", done: false },
  { time: "22:30", label: "יציאה לילה — פיצ'", done: false },
];

interface TopTask {
  id: string;
  text: string;
  done: boolean;
  urgent: boolean;
}

const DEFAULT_TOP_TASKS: TopTask[] = [
  { id: "t1", text: "לשלם חוב ביטוח לאומי 823₪", done: false, urgent: true },
  { id: "t2", text: "לבדוק סטטוס פנייה 14463374 (פיצויים)", done: false, urgent: true },
  { id: "t3", text: "לתאם חיסון כלבת לפיצ'", done: false, urgent: true },
];

function timeNow(): string {
  return new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function dateNow(): string {
  return new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
}

// ─── קומפוננטים ──────────────────────────────────────────────────────────────

function TopTaskCard({ task, onToggle }: { task: TopTask; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%", background: task.done ? "#f0fdf4" : task.urgent ? "#fef2f2" : "#fff",
        border: `1.5px solid ${task.done ? "#86efac" : task.urgent ? "#fca5a5" : "#e2e8f0"}`,
        borderRadius: 14, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 14,
        cursor: "pointer", textAlign: "right", direction: "rtl",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${task.done ? "#22c55e" : task.urgent ? "#dc2626" : "#94a3b8"}`,
        background: task.done ? "#22c55e" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 14, fontWeight: 700,
      }}>
        {task.done ? "✓" : ""}
      </div>
      <span style={{
        flex: 1, fontSize: 15, fontWeight: 600,
        color: task.done ? "#94a3b8" : "#1e293b",
        textDecoration: task.done ? "line-through" : "none",
      }}>
        {task.text}
      </span>
      {task.urgent && !task.done && (
        <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "2px 6px" }}>
          דחוף
        </span>
      )}
    </button>
  );
}

// ─── קומפוננט ראשי ──────────────────────────────────────────────────────────

export default function DailyBrain() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [topTasks, setTopTasks] = useState<TopTask[]>(DEFAULT_TOP_TASKS);
  const [dogSchedule, setDogSchedule] = useState<DogEvent[]>(DOG_SCHEDULE_DEFAULT);
  const [newTaskText, setNewTaskText] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const createNode = trpc.nodes.create.useMutation({
    onSuccess: () => {
      toast.success("הערה נשמרה");
      setNoteText("");
      setShowNote(false);
    },
    onError: () => toast.error("שגיאה בשמירה"),
  });

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ direction: "rtl", color: "#64748b" }}>יש להתחבר</p>
      </div>
    );
  }

  const doneCount = topTasks.filter(t => t.done).length;
  const nextTask = topTasks.find(t => !t.done);

  // Next dog event
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const nextDogEvent = dogSchedule.find(e => {
    const [h, m] = e.time.split(":").map(Number);
    return !e.done && h * 60 + m >= nowMinutes;
  });

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setTranscribing(true);
        // Upload to storage then transcribe
        const formData = new FormData();
        formData.append("file", blob, "voice.webm");
        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const { url } = await res.json() as { url: string };
          const tRes = await fetch("/api/trpc/nodes.transcribeVoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ json: { audioUrl: url } }),
          });
          const tData = await tRes.json() as { result?: { data?: { json?: { text?: string } } } };
          const text = tData?.result?.data?.json?.text ?? "";
          if (text) setNoteText(prev => prev ? prev + "\n" + text : text);
          toast.success("תמלול הושלם");
        } catch {
          toast.error("שגיאה בתמלול");
        } finally {
          setTranscribing(false);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setIsRecording(true);
    } catch {
      toast.error("לא ניתן לגשת למיקרופון");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setIsRecording(false);
  }

  function saveNote() {
    if (!noteText.trim()) return;
    createNode.mutate({
      type: "note",
      body: noteText,
      tags: "brain,daily",
      language: "he",
    });
  }

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
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>המוח היומי</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{dateNow()} · {timeNow()}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* "עכשיו" — הצעד הבא */}
        {nextTask && (
          <div style={{
            background: "linear-gradient(135deg, #1e293b, #334155)",
            borderRadius: 18, padding: "20px 20px",
            color: "#fff",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8, letterSpacing: 1 }}>
              ▶ עכשיו — הצעד הבא
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>
              {nextTask.text}
            </div>
            <button
              onClick={() => setTopTasks(prev => prev.map(t => t.id === nextTask.id ? { ...t, done: true } : t))}
              style={{
                marginTop: 14, padding: "10px 20px",
                background: "#22c55e", color: "#fff",
                border: "none", borderRadius: 12,
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              ✓ סיימתי
            </button>
          </div>
        )}

        {/* 3 הדברים החשובים */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              3 הדברים להיום
              <span style={{ marginRight: 8, fontSize: 13, color: "#94a3b8", fontWeight: 400 }}>
                {doneCount}/{topTasks.length}
              </span>
            </h2>
            <button
              onClick={() => setShowAddTask(v => !v)}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6366f1" }}
            >
              +
            </button>
          </div>

          {showAddTask && (
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                placeholder="משימה חדשה..."
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 12,
                  border: "1.5px solid #e2e8f0", fontSize: 14, direction: "rtl",
                  outline: "none",
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && newTaskText.trim()) {
                    setTopTasks(prev => [...prev, {
                      id: Date.now().toString(),
                      text: newTaskText.trim(),
                      done: false,
                      urgent: false,
                    }]);
                    setNewTaskText("");
                    setShowAddTask(false);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newTaskText.trim()) {
                    setTopTasks(prev => [...prev, {
                      id: Date.now().toString(),
                      text: newTaskText.trim(),
                      done: false,
                      urgent: false,
                    }]);
                    setNewTaskText("");
                    setShowAddTask(false);
                  }
                }}
                style={{
                  padding: "10px 16px", background: "#6366f1", color: "#fff",
                  border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                הוסף
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topTasks.map(task => (
              <TopTaskCard
                key={task.id}
                task={task}
                onToggle={() => setTopTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
              />
            ))}
          </div>
        </div>

        {/* פיצ' — לוח זמנים */}
        <div>
          <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700 }}>
            🐕 פיצ' — לוח יציאות
            {nextDogEvent && (
              <span style={{ marginRight: 8, fontSize: 13, color: "#d97706", fontWeight: 400 }}>
                הבא: {nextDogEvent.time}
              </span>
            )}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {dogSchedule.map((e, i) => (
              <button
                key={i}
                onClick={() => setDogSchedule(prev => prev.map((ev, j) => j === i ? { ...ev, done: !ev.done } : ev))}
                style={{
                  padding: "12px 14px", borderRadius: 12,
                  background: e.done ? "#f0fdf4" : "#fff",
                  border: `1.5px solid ${e.done ? "#86efac" : "#e2e8f0"}`,
                  cursor: "pointer", textAlign: "right", direction: "rtl",
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${e.done ? "#22c55e" : "#94a3b8"}`,
                  background: e.done ? "#22c55e" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 12,
                }}>
                  {e.done ? "✓" : ""}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: e.done ? "#94a3b8" : "#1e293b" }}>{e.time}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.label.replace(" — פיצ'", "")}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* הערה קולית */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🎙️ הערה מהירה</h2>
            <button
              onClick={() => setShowNote(v => !v)}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6366f1" }}
            >
              {showNote ? "▲" : "▼"}
            </button>
          </div>
          {showNote && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="הקלד הערה... או הקלט קול"
                style={{
                  width: "100%", minHeight: 100, padding: "10px 12px",
                  border: "1.5px solid #e2e8f0", borderRadius: 10,
                  fontSize: 14, direction: "rtl", resize: "none", outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={transcribing}
                  style={{
                    flex: 1, padding: "10px 16px",
                    background: isRecording ? "#dc2626" : "#6366f1",
                    color: "#fff", border: "none", borderRadius: 10,
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}
                >
                  {transcribing ? "⏳ מתמלל..." : isRecording ? "⏹ עצור הקלטה" : "🎙️ הקלט"}
                </button>
                <button
                  onClick={saveNote}
                  disabled={!noteText.trim() || createNode.isPending}
                  style={{
                    flex: 1, padding: "10px 16px",
                    background: noteText.trim() ? "#22c55e" : "#e2e8f0",
                    color: noteText.trim() ? "#fff" : "#94a3b8",
                    border: "none", borderRadius: 10,
                    fontWeight: 700, fontSize: 14, cursor: noteText.trim() ? "pointer" : "default",
                  }}
                >
                  💾 שמור
                </button>
              </div>
            </div>
          )}
        </div>

        {/* קישורים מהירים */}
        <div>
          <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700 }}>קישורים מהירים</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "בירוקרטיה", icon: "🏛️", path: "/bureaucracy", color: "#fef2f2", border: "#fca5a5" },
              { label: "כספים", icon: "💰", path: "/finance-snapshot", color: "#f0fdf4", border: "#86efac" },
              { label: "אנשים", icon: "👥", path: "/people", color: "#fffbeb", border: "#fcd34d" },
              { label: "יומן יומי", icon: "📋", path: "/tracker", color: "#fdf2f8", border: "#f9a8d4" },
            ].map(link => (
              <button
                key={link.path}
                onClick={() => setLocation(link.path)}
                style={{
                  padding: "14px 12px", borderRadius: 14,
                  background: link.color, border: `1.5px solid ${link.border}`,
                  cursor: "pointer", textAlign: "right", direction: "rtl",
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <span style={{ fontSize: 24 }}>{link.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
