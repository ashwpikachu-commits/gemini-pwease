import { useMemo, useState } from "react";
import {
  Brain,
  Map as MapIcon,
  CalendarClock,
  Activity,
  BarChart3,
  Download,
  AlertTriangle,
  Sparkles,
  LogOut,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import type { StudySession, StudySessionInput, TopicState, RegularTest } from "@/lib/types";
import { buildTopicState } from "@/lib/spacedRepetition";
import { downloadCsv } from "@/lib/csv";
import { getLoggedInStudentId, logoutStudent, isAdminMode, setAdminMode } from "@/lib/auth";
import LearningPath from "@/components/LearningPath";
import PracticeView from "@/components/PracticeView";
import ScheduleView from "@/components/ScheduleView";
import RetentionView from "@/components/RetentionView";
import SessionsTable from "@/components/SessionsTable";
import StatsView from "@/components/StatsView";

type Tab = "path" | "practice" | "schedule" | "retention" | "sessions" | "stats";

interface Props {
  sessions: StudySession[];
  regularTests: RegularTest[];
  loading: boolean;
  error: string | null;
  onAdd: (input: StudySessionInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddPractice?: (input: {
    student_id: string;
    topic: string;
    score: number;
    accuracy_pct: number;
    duration_seconds: number;
    days_included: string;
    question_count: number;
  }) => Promise<void>;
  onAddTest?: (input: {
    student_id: string;
    test_number: number;
    topic: string;
    score: number;
    accuracy_pct: number;
    duration_seconds: number;
    question_count: number;
  }) => Promise<void>;
}

export default function App({ sessions, regularTests, loading, error, onAdd, onDelete, onAddPractice, onAddTest }: Props) {
  const [tab, setTab] = useState<Tab>("path");
  const [adminMode, setAdminModeState] = useState(isAdminMode());
  const studentId = getLoggedInStudentId() ?? "";

  const topicStates = useMemo<TopicState[]>(() => {
    const map = new Map<string, StudySession[]>();
    for (const s of sessions) {
      if (s.student_id !== studentId) continue;
      const key = `${s.student_id}||${s.topic}`;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    const states: TopicState[] = [];
    for (const [key, sess] of map) {
      const [sid, topic] = key.split("||");
      states.push(buildTopicState(sid, topic, sess));
    }
    return states.sort((a, b) => a.next_review.localeCompare(b.next_review));
  }, [sessions, studentId]);

  const studentSessions = useMemo(
    () => sessions.filter((s) => s.student_id === studentId),
    [sessions, studentId]
  );

  const tabs: { id: Tab; label: string; icon: typeof Brain }[] = [
    { id: "path", label: "Learning Path", icon: MapIcon },
    { id: "practice", label: "Practice", icon: Sparkles },
    { id: "schedule", label: "Schedule", icon: CalendarClock },
    { id: "retention", label: "Retention", icon: Activity },
    { id: "sessions", label: "Sessions", icon: BarChart3 },
  ];

  if (adminMode) {
    tabs.push({ id: "stats" as Tab, label: "Analytics", icon: BarChart3 });
  }

  const flaggedCount = topicStates.filter((t) => t.is_flagged).length;

  const handleLogout = () => {
    logoutStudent();
    window.location.reload();
  };

  const toggleAdmin = () => {
    const next = !adminMode;
    setAdminMode(next);
    setAdminModeState(next);
    if (!next && tab === "stats") setTab("path");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-sm">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Japanese Study Guide
              </h1>
              <p className="text-xs text-slate-500">
                Spaced repetition learning · {studentId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAdmin}
              title="Toggle admin / research view"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              {adminMode ? <EyeOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {adminMode ? "Exit Admin" : "Admin"}
            </button>
            {adminMode && (
              <button
                onClick={() => downloadCsv(sessions, `study_sessions_${Date.now()}.csv`)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            )}
            <button
              onClick={handleLogout}
              title="Logout / Switch Student ID"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
        {/* Tabs */}
        <nav className="mx-auto max-w-6xl px-4">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-teal-600 text-teal-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {t.id === "schedule" && flaggedCount > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-700">
                      {flaggedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
              <p className="text-sm">Loading sessions…</p>
            </div>
          </div>
        ) : (
          <>
            {tab === "path" && (
              <LearningPath onAdd={onAdd} sessions={studentSessions} regularTests={regularTests} studentId={studentId} onAddTest={onAddTest} />
            )}
            {tab === "practice" && (
              <PracticeView sessions={studentSessions} studentId={studentId} onAdd={onAdd} onAddPractice={onAddPractice} />
            )}
            {tab === "schedule" && (
              <ScheduleView topicStates={topicStates} />
            )}
            {tab === "retention" && <RetentionView topicStates={topicStates} />}
            {tab === "sessions" && (
              <SessionsTable sessions={studentSessions} onDelete={onDelete} />
            )}
            {tab === "stats" && adminMode && (
              <StatsView sessions={studentSessions} topicStates={topicStates} />
            )}
          </>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
        Spaced repetition learning · Research data stored in Supabase
      </footer>
    </div>
  );
}
