import { useMemo, useState } from "react";
import { Map as MapIcon, CheckCircle2, Lock, Star, Play, Trophy, ClipboardCheck } from "lucide-react";
import { CURRICULUM } from "@/lib/curriculum";
import type { DayCurriculum } from "@/lib/curriculum";
import type { StudySession, StudySessionInput, RegularTest } from "@/lib/types";
import LessonRunner from "./LessonRunner";

interface Props {
  onAdd: (input: StudySessionInput) => Promise<void>;
  sessions: StudySession[];
  regularTests: RegularTest[];
  studentId: string;
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

type TestNode = {
  kind: "test";
  number: number;
  afterDay: number;
  title: string;
};

type PathNode =
  | { kind: "day"; day: DayCurriculum }
  | TestNode;

function localDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getPathNodes(): PathNode[] {
  const nodes: PathNode[] = [];
  for (const day of CURRICULUM) {
    nodes.push({ kind: "day", day });
    if (day.day < 7 && day.day % 2 === 0) {
      nodes.push({ kind: "test", number: day.day / 2, afterDay: day.day, title: `Regular Test ${day.day / 2}` });
    }
  }
  return nodes;
}

export default function LearningPath({ onAdd, sessions, regularTests, studentId, onAddTest }: Props) {
  const [activeDay, setActiveDay] = useState<DayCurriculum | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  const progress = useMemo(() => {
    const completed = new Set<number>();
    const completionDates: Record<number, string> = {};
    const completedTests = new Set<number>();

    for (const session of sessions) {
      const dayMatch = session.topic.match(/Day (\d+)/);
      if (dayMatch) {
        const day = Number(dayMatch[1]);
        completed.add(day);
        completionDates[day] ??= session.studied_at.slice(0, 10);
      }
    }

    for (const test of regularTests) {
      completedTests.add(test.test_number);
    }

    return { completed, completionDates, completedTests };
  }, [sessions, regularTests]);

  const dayAvailability = useMemo(() => {
    const today = localDateString();
    const result: Record<number, { available: boolean; reason?: string }> = {};

    for (const day of CURRICULUM) {
      if (progress.completed.has(day.day)) {
        result[day.day] = { available: true };
        continue;
      }
      if (day.day === 1) {
        result[day.day] = { available: true };
        continue;
      }

      const previousDay = day.day - 1;
      const previousComplete = progress.completed.has(previousDay);
      const completedToday = progress.completionDates[previousDay] === today;
      const requiredTest = previousDay % 2 === 0 ? previousDay / 2 : null;
      const testComplete = requiredTest === null || progress.completedTests.has(requiredTest);

      if (!previousComplete) {
        result[day.day] = { available: false, reason: "Complete the previous day first" };
      } else if (requiredTest !== null && !testComplete) {
        result[day.day] = { available: false, reason: `Complete Regular Test ${requiredTest} first` };
      } else if (completedToday) {
        result[day.day] = { available: false, reason: "Locked until tomorrow" };
      } else {
        result[day.day] = { available: true };
      }
    }
    return result;
  }, [progress]);

  const testAvailability = useMemo(() => {
    const result: Record<number, { available: boolean; reason?: string }> = {};
    for (const test of [1, 2, 3]) {
      const afterDay = test * 2;
      if (progress.completedTests.has(test)) {
        result[test] = { available: true };
      } else if (!progress.completed.has(afterDay)) {
        result[test] = { available: false, reason: `Complete Day ${afterDay} first` };
      } else {
        result[test] = { available: true };
      }
    }
    return result;
  }, [progress]);

  if (activeDay) {
    return (
      <LessonRunner
        day={activeDay}
        studentId={studentId}
        onAdd={onAdd}
        onExit={() => setActiveDay(null)}
        onComplete={() => setShowCompletion(true)}
        onAddTest={onAddTest}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm"><MapIcon className="h-5 w-5" /></div>
          <div><h2 className="text-lg font-semibold text-slate-900">Learning Path</h2><p className="text-sm text-slate-500">A 7-day curriculum with formal tests after every two lessons.</p></div>
        </div>
      </div>

      <div className="relative flex flex-col items-center py-4">
        {getPathNodes().map((node, index) => {
          if (node.kind === "test") {
            const availability = testAvailability[node.number];
            const completed = progress.completedTests.has(node.number);
            const locked = !availability.available;
            const testDay = CURRICULUM[node.afterDay - 1];
            const testCurriculum: DayCurriculum = {
              ...testDay,
              title: node.title,
              focus: "Formal assessment",
              description: "Test your understanding before continuing to the next part of the path.",
              isCumulativeReview: true,
              isRegularTest: true,
            };
            return (
              <div key={node.title} className="relative mb-4 flex w-full max-w-md flex-col items-center">
                <div className="absolute bottom-full h-4 w-0.5 bg-amber-200" />
                <button
                  onClick={() => !locked && setActiveDay(testCurriculum)}
                  disabled={locked}
                  className={`group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left shadow-sm transition ${locked ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60" : completed ? "border-emerald-300 bg-emerald-50 hover:shadow-md" : "border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow-md"}`}
                >
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${locked ? "bg-slate-300" : completed ? "bg-emerald-500" : "bg-amber-500"}`}>
                    {locked ? <Lock className="h-5 w-5" /> : completed ? <CheckCircle2 className="h-6 w-6" /> : <ClipboardCheck className="h-6 w-6" />}
                  </div>
                  <div className="flex-1"><span className="text-xs font-semibold uppercase tracking-wide text-amber-700">Assessment barrier</span><h3 className="mt-0.5 text-sm font-semibold text-slate-900">{node.title}</h3><p className="text-xs text-slate-500">{locked ? availability.reason : "Required before the next lesson"}</p></div>
                  {!locked && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Play className="h-4 w-4" /></div>}
                </button>
              </div>
            );
          }

          const day = node.day;
          const isCompleted = progress.completed.has(day.day);
          const availability = dayAvailability[day.day];
          const isLocked = !availability.available;
          return (
            <div key={`day-${day.day}`} className="relative mb-4 flex w-full max-w-md flex-col items-center">
              {index < getPathNodes().length - 1 && <div className="absolute left-1/2 top-full h-4 w-0.5 -translate-x-1/2 bg-teal-200" />}
              <button onClick={() => !isLocked && setActiveDay(day)} disabled={isLocked} className={`group relative flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left shadow-sm transition ${isLocked ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60" : isCompleted ? "border-emerald-300 bg-emerald-50 hover:shadow-md" : "border-teal-300 bg-white hover:border-teal-400 hover:shadow-md"}`}>
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${isLocked ? "bg-slate-300" : isCompleted ? "bg-emerald-500" : day.isCumulativeReview ? "bg-amber-500" : "bg-teal-500"}`}>
                  {isLocked ? <Lock className="h-5 w-5" /> : isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Star className="h-5 w-5" />}
                </div>
                <div className="flex-1"><div className="flex items-center gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-teal-600">Day {day.day}</span>{isCompleted && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Done</span>}</div><h3 className="mt-0.5 text-sm font-semibold text-slate-900">{day.title}</h3><p className="text-xs text-slate-500">{day.focus}</p>{isLocked && <p className="mt-1 text-xs font-medium text-slate-400">{availability.reason}</p>}</div>
                {!isLocked && <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-teal-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white"}`}><Play className="h-4 w-4" /></div>}
              </button>
              {!isLocked && <div className="mt-2 flex flex-wrap gap-1.5 px-2">{day.vocab.slice(0, 5).map((v) => <span key={v.hiragana} className="inline-flex flex-col items-center rounded-lg bg-slate-50 px-2 py-1 text-xs"><span className="text-[10px] text-slate-400">{v.romaji}</span><span className="font-medium text-slate-700">{v.hiragana}</span></span>)}{day.vocab.length > 5 && <span className="inline-flex items-center rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-400">+{day.vocab.length - 5} more</span>}</div>}
            </div>
          );
        })}
      </div>

      {showCompletion && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"><div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 text-white"><Trophy className="h-8 w-8" /></div><h3 className="text-lg font-bold text-slate-900">You’re done for today</h3><p className="mt-2 text-sm text-slate-500">Come back tomorrow for the next unlocked lesson.</p><button onClick={() => setShowCompletion(false)} className="mt-6 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white">Continue</button></div></div>}
    </div>
  );
}
