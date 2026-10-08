import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  Lock,
  Play,
  Sparkles,
  Target,
  Volume2,
  X,
} from "lucide-react";
import {
  CURRICULUM,
  GOJUON_DAKUTEN_ROWS,
  GOJUON_PLAIN_ROWS,
  PARTICLE_EXCEPTIONS,
  PARTICLES_REFERENCE,
  type DayCurriculum,
} from "@/lib/curriculum";
import { practiceQuestionCount } from "@/lib/lessonGenerator";
import type { StudySession, StudySessionInput } from "@/lib/types";
import { getMissedVocabKeys } from "@/lib/missedQuestions";
import LessonRunner from "./LessonRunner";

interface Props {
  sessions: StudySession[];
  studentId: string;
  onAdd: (input: StudySessionInput) => Promise<void>;
  onAddPractice?: (input: {
    student_id: string;
    topic: string;
    score: number;
    accuracy_pct: number;
    duration_seconds: number;
    days_included: string;
    question_count: number;
  }) => Promise<void>;
}

type PracticeSection = "quiz" | "chart" | "particles";

function calendarDate(value: string): string {
  return value.slice(0, 10);
}

function todayInLocalTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getProgress(sessions: StudySession[]) {
  const completed = new Set<number>();
  const completionDates: Record<number, string> = {};
  const regularTests = new Set<number>();

  for (const session of sessions) {
    const dayMatch = session.topic.match(/Day (\d+)/);
    if (dayMatch) {
      const day = Number(dayMatch[1]);
      completed.add(day);
      completionDates[day] ??= calendarDate(session.studied_at);
    }
    const testMatch = session.topic.match(/Regular Test (\d+)/);
    if (testMatch) regularTests.add(Number(testMatch[1]));
  }

  const unlocked = new Set<number>([1]);
  for (const day of CURRICULUM) {
    if (day.day === 1) continue;
    const previousDate = completionDates[day.day - 1];
    const previousDone = completed.has(day.day - 1);
    const testNumber = Math.ceil((day.day - 1) / 2);
    const testDone = day.day <= 2 || regularTests.has(testNumber);
    if (previousDone && previousDate < todayInLocalTime() && testDone) unlocked.add(day.day);
    if (completed.has(day.day)) unlocked.add(day.day);
  }

  return { completed, unlocked, regularTests };
}

function speak(text: string): void {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function combineDays(days: DayCurriculum[]): DayCurriculum {
  const first = days[0];
  return {
    ...first,
    day: Math.max(...days.map((day) => day.day)),
    title: `Practice: Days ${days.map((day) => day.day).join(", ")}`,
    focus: "Mixed practice from your selected unlocked days",
    description: "Questions are limited to the vocabulary and sentences you selected.",
    vocab: days.flatMap((day) => day.vocab),
    sentences: days.flatMap((day) => day.sentences),
    grammarNotes: days.flatMap((day) => day.grammarNotes),
    isCumulativeReview: true,
  };
}

export default function PracticeView({ sessions, studentId, onAdd, onAddPractice }: Props) {
  const [section, setSection] = useState<PracticeSection>("quiz");
  const [activeDay, setActiveDay] = useState<DayCurriculum | null>(null);
  const [defaultMixed, setDefaultMixed] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedChar, setSelectedChar] = useState<{ char: string; romaji: string } | null>(null);
  const [overlayStage, setOverlayStage] = useState(0);
  const progress = useMemo(() => getProgress(sessions), [sessions]);
  const missedKeys = useMemo(() => getMissedVocabKeys(studentId), [studentId]);
  const unlockedDays = CURRICULUM.filter((day) => progress.unlocked.has(day.day));
  const dayCount = defaultMixed ? unlockedDays.length : selectedDays.length;
  const questionCount = practiceQuestionCount(Math.max(dayCount, 1));

  function startPractice(): void {
    const days = defaultMixed
      ? unlockedDays
      : unlockedDays.filter((day) => selectedDays.includes(day.day));
    if (days.length === 0) return;
    setActiveDay(combineDays(days));
  }

  function openChar(char: { char: string; romaji: string }): void {
    setSelectedChar(char);
    setOverlayStage(1);
    window.setTimeout(() => setOverlayStage(2), 180);
    window.setTimeout(() => setOverlayStage(3), 420);
  }

  if (activeDay) {
    return (
      <LessonRunner
        day={activeDay}
        studentId={studentId}
        onAdd={onAdd}
        onExit={() => setActiveDay(null)}
        isPractice
        missedKeys={missedKeys}
        selectedDays={defaultMixed ? undefined : selectedDays}
        questionCount={questionCount}
        onAddPractice={onAddPractice}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Practice</h2>
            <p className="text-sm text-slate-500">Build confidence with unlocked lessons, Hiragana, and particles.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-3">
        {([
          ["quiz", "Section 1: Quiz Yourself", Target],
          ["chart", "Section 2: Hiragana Chart", BookOpen],
          ["particles", "Section 3: Particles Guide", Sparkles],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
              section === key ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {section === "quiz" && (
        <div className="space-y-5">
          {missedKeys.length > 0 && (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
              <div className="mb-2 flex items-center gap-2 text-amber-700">
                <Target className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Targeted reinforcement is ready</h3>
              </div>
              <p className="text-sm text-amber-700">Your next practice set will prioritize at least two previously missed items.</p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Choose your practice pool</h3>
                <p className="mt-1 text-sm text-slate-500">Locked days never contribute questions.</p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{questionCount} questions</span>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
              <input
                type="checkbox"
                checked={defaultMixed}
                onChange={(event) => setDefaultMixed(event.target.checked)}
                className="h-4 w-4 accent-teal-600"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-900">Default: Mixed Unlocked Content</span>
                <span className="block text-xs text-slate-500">Use all {unlockedDays.length} currently unlocked days.</span>
              </span>
            </label>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {CURRICULUM.map((day) => {
                const unlocked = progress.unlocked.has(day.day);
                const checked = selectedDays.includes(day.day);
                return (
                  <label
                    key={day.day}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                      defaultMixed || !unlocked ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50" : "cursor-pointer border-slate-200 hover:border-teal-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={defaultMixed || !unlocked}
                      checked={checked}
                      onChange={() => setSelectedDays((current) => checked ? current.filter((value) => value !== day.day) : [...current, day.day])}
                      className="h-4 w-4 accent-teal-600"
                    />
                    <span className="flex-1 text-sm font-medium text-slate-700">Day {day.day}: {day.title}</span>
                    {!unlocked && <Lock className="h-4 w-4 text-slate-400" />}
                    {unlocked && checked && <Check className="h-4 w-4 text-teal-600" />}
                  </label>
                );
              })}
            </div>

            <button
              onClick={startPractice}
              disabled={dayCount === 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Play className="h-4 w-4" /> Start Practice
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {section === "chart" && <HiraganaChart onSelect={openChar} />}
      {section === "particles" && <ParticlesGuide />}

      {selectedChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setSelectedChar(null)}>
          <div className={`w-full max-w-sm rounded-3xl border border-teal-200 bg-white p-7 text-center shadow-2xl transition duration-300 ${overlayStage >= 2 ? "scale-100 opacity-100" : "scale-75 opacity-0"}`} onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setSelectedChar(null)} className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"><X className="h-4 w-4" /></button>
            <p className={`text-sm font-semibold text-teal-600 transition ${overlayStage >= 3 ? "opacity-100" : "opacity-0"}`}>{selectedChar.romaji}</p>
            <p className="my-4 text-8xl font-semibold text-slate-900">{selectedChar.char}</p>
            <button onClick={() => speak(selectedChar.char)} className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-teal-700 transition ${overlayStage >= 3 ? "opacity-100" : "opacity-0"}`}><Volume2 className="h-5 w-5" /></button>
            {PARTICLE_EXCEPTIONS[selectedChar.char] && <p className="mt-5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">{PARTICLE_EXCEPTIONS[selectedChar.char]}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function HiraganaChart({ onSelect }: { onSelect: (char: { char: string; romaji: string }) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">Interactive Hiragana Chart</h3>
        <p className="mt-1 text-sm text-slate-500">The complete Gojūon matrix is available for reference. Select a tile to hear it and see its particle note.</p>
      </div>
      <ChartRows rows={GOJUON_PLAIN_ROWS} onSelect={onSelect} />
      <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Dakuten &amp; handakuten</span><div className="h-px flex-1 bg-slate-200" /></div>
      <ChartRows rows={GOJUON_DAKUTEN_ROWS} onSelect={onSelect} />
    </div>
  );
}

function ChartRows({ rows, onSelect }: { rows: typeof GOJUON_PLAIN_ROWS; onSelect: (char: { char: string; romaji: string }) => void }) {
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[2rem_repeat(5,minmax(0,1fr))] gap-2">
          <div className="flex items-center justify-center text-xs font-bold text-slate-400">{row.label}</div>
          {row.chars.map((item, index) => item.char ? (
            <button key={`${row.label}-${index}`} onClick={() => onSelect(item)} className="group flex min-h-20 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 hover:shadow-sm">
              <span className="text-[10px] font-medium text-slate-400">{item.romaji}</span>
              <span className="text-2xl font-semibold text-slate-900">{item.char}</span>
            </button>
          ) : <div key={`${row.label}-${index}`} className="min-h-20 rounded-xl bg-slate-50/40" />)}
        </div>
      ))}
    </div>
  );
}

function ParticlesGuide() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5"><h3 className="text-base font-semibold text-slate-900">Particles Guide</h3><p className="mt-1 text-sm text-slate-500">Use this reference while building your own sentences.</p></div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">S. No.</th><th className="px-4 py-3">Particle</th><th className="px-4 py-3">Romaji</th><th className="px-4 py-3">Use Case</th><th className="px-4 py-3">Example Sentence</th></tr></thead>
          <tbody>{PARTICLES_REFERENCE.map((particle, index) => <tr key={particle.hiragana} className="border-t border-slate-100"><td className="px-4 py-4 text-slate-400">{index + 1}</td><td className="px-4 py-4 text-2xl font-semibold text-slate-900">{particle.hiragana}</td><td className="px-4 py-4 font-medium text-teal-700">{particle.romaji}</td><td className="px-4 py-4 text-slate-600">{particle.useCase}</td><td className="px-4 py-4"><div className="font-semibold text-slate-900">{particle.exampleHiragana}</div><div className="text-xs text-slate-400">{particle.exampleRomaji}</div><div className="mt-1 text-xs text-slate-500">{particle.exampleEnglish}</div></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
