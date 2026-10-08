import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Volume2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  Play,
  AlertTriangle,
  X,
  VolumeX,
  RotateCcw,
  BookOpen,
  PenTool,
  Lightbulb,
} from "lucide-react";
import type { DayCurriculum, SentenceItem } from "@/lib/curriculum";
import { getHiraganaCharsUpToDay } from "@/lib/curriculum";
import {
  generateLessonQuestions,
  generatePracticeQuestions,
  scoreLesson,
  type LessonQuestion,
} from "@/lib/lessonGenerator";
import type { StudySessionInput } from "@/lib/types";
import { logMissedQuestions } from "@/lib/missedQuestions";
import { formatDuration } from "@/lib/duration";

interface Props {
  day: DayCurriculum;
  studentId: string;
  onAdd: (input: StudySessionInput) => Promise<void>;
  onExit: () => void;
  onComplete?: () => void;
  isPractice?: boolean;
  missedKeys?: string[];
  selectedDays?: number[];
  questionCount?: number;
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

type Phase = "intro1" | "intro2" | "active" | "results" | "review";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function speak(text: string, boost = false) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.8;
  if (boost) {
    const ctx = getAudioContext();
    if (ctx) {
      try {
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.8;
        utterance.volume = 1;
      } catch {
        // fallback to default volume
      }
    }
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function normalizeRomaji(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, "");
}

export default function LessonRunner({ day, studentId, onAdd, onExit, onComplete, isPractice, missedKeys, selectedDays, questionCount, onAddPractice, onAddTest }: Props) {
  const isTestMode = Boolean(day.isRegularTest);
  const [phase, setPhase] = useState<Phase>(isTestMode ? "active" : "intro1");
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [firstAttemptAnswers, setFirstAttemptAnswers] = useState<Record<string, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [exitConfirm, setShowExitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [animDir, setAnimDir] = useState<"left" | "right" | "none">("none");
  const [skippedListening, setSkippedListening] = useState<Set<string>>(new Set());
  const [romajiInputValue, setRomajiInputValue] = useState("");
  const [romajiInputSubmitted, setRomajiInputSubmitted] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const durationRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const hiraganaChars = useMemo(() => getHiraganaCharsUpToDay(day.day), [day.day]);

  const startQuiz = useCallback(() => {
    const qs = isPractice
      ? generatePracticeQuestions(day.day, questionCount ?? 20, missedKeys ?? [], selectedDays)
      : generateLessonQuestions(day, 22);
    setQuestions(qs);
    setAnswers({});
    setFirstAttemptAnswers({});
    setCurrentIdx(0);
    setShowFeedback(false);
    setSkippedListening(new Set());
    setSaved(false);
    setSubmitting(false);
    setRomajiInputValue("");
    setRomajiInputSubmitted(false);
    startTimeRef.current = Date.now();
    setPhase("active");
  }, [day, isPractice, questionCount, missedKeys, selectedDays]);

  useEffect(() => {
    if (isTestMode && questions.length === 0 && phase === "active") {
      startQuiz();
    }
  }, [isTestMode, questions.length, phase, startQuiz]);

  const current = questions[currentIdx];

  const result = useMemo(() => {
    if (phase !== "results" && phase !== "review") return null;
    return scoreLesson(questions, firstAttemptAnswers, skippedListening);
  }, [phase, questions, firstAttemptAnswers, skippedListening]);

  const handleSelect = useCallback(
    (choiceIndex: number) => {
      if (showFeedback) return;
      const q = current;
      if (!q) return;
      setShowFeedback(true);
      setFirstAttemptAnswers((prev) => {
        if (prev[q.id] !== undefined) return prev;
        return { ...prev, [q.id]: choiceIndex };
      });
      setAnswers((prev) => ({ ...prev, [q.id]: choiceIndex }));
      // Auto-play audio on answer for hiragana_romaji questions
      if (q.type === "hiragana_romaji") {
        speak(q.hiragana, true);
      }
    },
    [showFeedback, current]
  );

  const handleRomajiSubmit = useCallback(() => {
    if (showFeedback || romajiInputSubmitted) return;
    const q = current;
    if (!q || q.type !== "romaji_input") return;
    const isCorrect = normalizeRomaji(romajiInputValue) === normalizeRomaji(q.answerText ?? q.romaji);
    const choiceIndex = isCorrect ? 0 : 1;
    setShowFeedback(true);
    setRomajiInputSubmitted(true);
    setFirstAttemptAnswers((prev) => {
      if (prev[q.id] !== undefined) return prev;
      return { ...prev, [q.id]: choiceIndex };
    });
    setAnswers((prev) => ({ ...prev, [q.id]: choiceIndex }));
  }, [showFeedback, romajiInputSubmitted, romajiInputValue, current]);

  const handleSkipListening = useCallback(() => {
    if (!current) return;
    setSkippedListening((prev) => new Set(prev).add(current.id));
    advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  function advance() {
    setAnimDir("right");
    setTimeout(() => {
      setShowFeedback(false);
      setRomajiInputValue("");
      setRomajiInputSubmitted(false);
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        durationRef.current = Math.round((Date.now() - startTimeRef.current) / 1000);
        setPhase("results");
      }
      setAnimDir("none");
    }, 200);
  }

  const goNext = useCallback(() => {
    if (showFeedback) {
      advance();
      return;
    }
    const q = current;
    if (!q) return;
    if (q.type === "romaji_input" && !romajiInputSubmitted) return;
    if (firstAttemptAnswers[q.id] === undefined && !skippedListening.has(q.id)) return;
    if (currentIdx < questions.length - 1) {
      setAnimDir("right");
      setTimeout(() => {
        setShowFeedback(false);
        setRomajiInputValue("");
        setRomajiInputSubmitted(false);
        setCurrentIdx(currentIdx + 1);
        setAnimDir("none");
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFeedback, current, firstAttemptAnswers, skippedListening, currentIdx, questions.length, romajiInputSubmitted]);

  const goPrev = useCallback(() => {
    if (currentIdx === 0) return;
    setAnimDir("left");
    setTimeout(() => {
      const previous = questions[currentIdx - 1];
      setShowFeedback(Boolean(previous && (firstAttemptAnswers[previous.id] !== undefined || skippedListening.has(previous.id))));
      setRomajiInputValue("");
      setRomajiInputSubmitted(false);
      setCurrentIdx(currentIdx - 1);
      setAnimDir("none");
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, questions, firstAttemptAnswers, skippedListening]);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;
      if (Math.abs(dx) < 50 || Math.abs(dy) > 80) return;
      if (dx < 0) goPrev();
      else goNext();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIdx, questions, showFeedback]
  );

  // Auto-save results — route to correct table
  useEffect(() => {
    if (phase !== "results" || saved || submitting) return;
    const r = scoreLesson(questions, firstAttemptAnswers, skippedListening);
    setSubmitting(true);
    const topicLabel = isPractice ? `Practice: ${day.title}` : `Day ${day.day}: ${day.title}`;
    logMissedQuestions(studentId, sessionIdRef.current, topicLabel, questions, firstAttemptAnswers);

    if (isPractice && onAddPractice) {
      onAddPractice({
        student_id: studentId,
        topic: topicLabel,
        score: r.sm2Score,
        accuracy_pct: Math.round(r.percentage),
        duration_seconds: durationRef.current,
        days_included: selectedDays?.join(",") ?? "",
        question_count: r.total,
      })
        .then(() => { setSaved(true); setSubmitting(false); })
        .catch(() => { setSubmitting(false); });
    } else if (isTestMode && onAddTest) {
      const testNumber = Math.ceil(day.day / 2);
      onAddTest({
        student_id: studentId,
        test_number: testNumber,
        topic: `Regular Test ${testNumber}`,
        score: r.sm2Score,
        accuracy_pct: Math.round(r.percentage),
        duration_seconds: durationRef.current,
        question_count: r.total,
      })
        .then(() => { setSaved(true); setSubmitting(false); })
        .catch(() => { setSubmitting(false); });
    } else {
      onAdd({
        student_id: studentId,
        group_label: "B",
        topic: topicLabel,
        score: r.sm2Score,
        accuracy_pct: Math.round(r.percentage),
        duration_seconds: durationRef.current,
      })
        .then(() => { setSaved(true); setSubmitting(false); })
        .catch(() => { setSubmitting(false); });
    }
  }, [phase, saved, submitting, questions, firstAttemptAnswers, skippedListening, onAdd, onAddPractice, onAddTest, studentId, day, isPractice, isTestMode, selectedDays]);

  const progress = useMemo(() => {
    const answered = Object.keys(firstAttemptAnswers).length + skippedListening.size;
    return questions.length > 0 ? (answered / questions.length) * 100 : 0;
  }, [firstAttemptAnswers, skippedListening, questions.length]);

  const currentSelected = useMemo(() => {
    if (!current) return null;
    return answers[current.id] !== undefined ? answers[current.id] : null;
  }, [current, answers]);

  const currentIsAnswered = current
    ? firstAttemptAnswers[current.id] !== undefined || skippedListening.has(current.id)
    : false;

  // ---------- INTRO PAGE 1: HIRAGANA CHART ----------
  if (phase === "intro1") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowExitConfirm(true)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-sm font-medium text-slate-500">Day {day.day} · {day.title}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <PenTool className="h-5 w-5 text-teal-600" />
            <h2 className="text-xl font-bold text-slate-900">Hiragana Chart</h2>
          </div>
          <p className="mb-5 text-sm text-slate-500">Tap the speaker icon to hear each character pronounced by a native voice.</p>

          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {hiraganaChars.map(({ char, romaji }) => (
              <div key={char} className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:border-teal-200">
                <span className="text-[10px] text-slate-400">{romaji}</span>
                <span className="text-2xl font-semibold text-slate-900">{char}</span>
                <button onClick={() => speak(char)} className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition hover:bg-teal-100">
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setPhase("intro2")} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700">
          Next: Today's Vocabulary <ArrowRight className="h-5 w-5" />
        </button>

        {exitConfirm && <ExitConfirmModal onConfirm={() => { setShowExitConfirm(false); onExit(); }} onCancel={() => setShowExitConfirm(false)} />}
      </div>
    );
  }

  // ---------- INTRO PAGE 2: VOCABULARY + SENTENCES + GRAMMAR ----------
  if (phase === "intro2") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setPhase("intro1")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Back to Chart
          </button>
          <span className="text-sm font-medium text-slate-500">Day {day.day} · {day.title}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-600" />
            <h2 className="text-xl font-bold text-slate-900">Today's Characters &amp; Words</h2>
          </div>
          <p className="mb-5 text-sm text-slate-500">{day.description}</p>

          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Romaji</th>
                  <th className="px-4 py-2.5 font-medium">Hiragana</th>
                  <th className="px-4 py-2.5 font-medium">English</th>
                  <th className="px-4 py-2.5 font-medium text-right">Audio</th>
                </tr>
              </thead>
              <tbody>
                {day.vocab.map((v, i) => (
                  <tr key={i} className="border-t border-slate-50 transition hover:bg-teal-50/30">
                    <td className="px-4 py-2.5 text-slate-500">{v.romaji}</td>
                    <td className="px-4 py-2.5 text-lg font-semibold text-slate-900">{v.hiragana}</td>
                    <td className="px-4 py-2.5 text-slate-700">{v.english}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => speak(v.hiragana)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition hover:bg-teal-100">
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {day.grammarNotes.length > 0 && (
            <div className="mt-6 space-y-3">
              {day.grammarNotes.map((note, i) => (
                <div key={i} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-amber-800">{note.title}</h3>
                  </div>
                  <p className="text-sm text-amber-700">{note.body}</p>
                </div>
              ))}
            </div>
          )}

          {day.sentences.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Today's Sentences</h3>
              <div className="space-y-2">
                {day.sentences.map((s, i) => (
                  <SentenceDisplay key={i} sentence={s} />
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={startQuiz} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700">
          <Play className="h-5 w-5" /> Start Quiz
        </button>

        {exitConfirm && <ExitConfirmModal onConfirm={() => { setShowExitConfirm(false); onExit(); }} onCancel={() => setShowExitConfirm(false)} />}
      </div>
    );
  }

  // ---------- ACTIVE / REVIEW PHASE ----------
  if ((phase === "active" || phase === "review") && current) {
    const isReviewMode = phase === "review";
    const isCorrect = currentSelected === current.correctIndex;
    const isSkipped = skippedListening.has(current.id);
    const showFeedbackForCurrent = showFeedback || (isReviewMode && currentIsAnswered);
    const disableHints = isTestMode;
    const isHiraganaRomajiType = current.type === "hiragana_romaji";

    return (
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-2xl flex-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="flex items-center justify-between py-3">
          <button onClick={() => setShowExitConfirm(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-slate-500">
            {isReviewMode ? "Review" : "Question"} {currentIdx + 1} of {questions.length}
          </span>
          {isReviewMode && (
            <button onClick={() => setPhase("results")} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200">
              <X className="h-4 w-4" /> Exit Review
            </button>
          )}
        </div>

        <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className={`flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 ${animDir === "left" ? "-translate-x-4 opacity-0" : animDir === "right" ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"}`}>
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">{current.directionLabel}</span>
            {current.type === "listen" && <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-medium text-cyan-700">Listening</span>}
            {isReviewMode && <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Review Mode</span>}
            {isTestMode && <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Test</span>}
          </div>

          <p className="mb-5 whitespace-pre-line text-sm font-medium text-slate-600">{current.prompt}</p>

          {/* Main display */}
          {current.concealPrompt ? (
            <div className="mb-6 flex flex-col items-center gap-3 py-4">
              <button onClick={() => speak(current.hiragana)} className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg transition hover:scale-105">
                <Volume2 className="h-10 w-10" />
              </button>
              <p className="text-xs text-slate-400">Tap to play audio</p>
            </div>
          ) : current.type === "image" ? (
            <div className="mb-6 flex flex-col items-center gap-1 py-2">
              <span className="text-xs font-normal text-slate-400">{current.romaji}</span>
              <span className="text-4xl font-semibold text-slate-900">{current.hiragana}</span>
              <span className="text-sm text-slate-500">{current.english}</span>
              {current.showAudio && <button onClick={() => speak(current.hiragana)} className="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition hover:bg-teal-100"><Volume2 className="h-4 w-4" /></button>}
            </div>
          ) : current.type === "translate_en_jp" || current.type === "sentence_en_jp" ? (
            <div className="mb-6 flex flex-col items-center gap-1 py-2">
              <span className="text-lg font-semibold text-slate-900">{current.english}</span>
            </div>
          ) : current.type === "romaji_input" ? (
            <div className="mb-6 flex flex-col items-center gap-3 py-4">
              <span className="text-5xl font-semibold text-slate-900">{current.hiragana}</span>
              {current.showAudio && !isTestMode && <button onClick={() => speak(current.hiragana)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition hover:bg-teal-100"><Volume2 className="h-4 w-4" /></button>}
              <input
                type="text"
                value={romajiInputValue}
                onChange={(e) => setRomajiInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && romajiInputValue.trim()) handleRomajiSubmit(); }}
                disabled={showFeedbackForCurrent || isReviewMode}
                placeholder="Type romaji here..."
                autoFocus
                className="w-full max-w-xs rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-lg font-medium text-slate-900 outline-none transition focus:border-teal-500 disabled:bg-slate-50"
              />
              {!showFeedbackForCurrent && !isReviewMode && (
                <button onClick={handleRomajiSubmit} disabled={!romajiInputValue.trim()} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-40">
                  Submit <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {showFeedbackForCurrent && (
                <p className={`text-sm font-medium ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                  {isCorrect ? "Correct!" : `Correct answer: ${current.answerText ?? current.romaji}`}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-6 flex flex-col items-center gap-1 py-2">
              {/* Strict vertical ruby alignment: romaji directly above hiragana */}
              <span className="inline-flex flex-col items-center" style={{ lineHeight: 1.2 }}>
                <span className="text-xs text-slate-400">{current.romaji}</span>
                <span className="text-4xl font-semibold text-slate-900">{current.hiragana}</span>
              </span>
              {current.type === "translate_jp_en" || current.type === "sentence_jp_en" ? (
                !disableHints && current.hintTooltip ? (
                  <WordTooltip text={current.hintTooltip} />
                ) : null
              ) : (
                <span className="text-sm text-slate-500">{current.english}</span>
              )}
              {/* Boosted audio for hiragana_romaji, normal for others */}
              {current.showAudio && <button onClick={() => speak(current.hiragana, isHiraganaRomajiType)} className="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition hover:bg-teal-100"><Volume2 className="h-4 w-4" /></button>}
            </div>
          )}

          {/* Image choices */}
          {current.type === "image" && (
            <div className="grid grid-cols-2 gap-3">
              {current.choices.map((url, i) => {
                const isThisSelected = currentSelected === i;
                const isThisCorrect = i === current.correctIndex;
                let cardClass = "border-slate-200 hover:border-teal-300";
                if (showFeedbackForCurrent) {
                  if (isThisCorrect) cardClass = "border-emerald-500 ring-2 ring-emerald-500/30";
                  else if (isThisSelected) cardClass = "border-red-500 ring-2 ring-red-500/30";
                  else cardClass = "border-slate-200 opacity-50";
                }
                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={showFeedbackForCurrent || isReviewMode} className={`relative overflow-hidden rounded-xl border-2 transition ${cardClass}`}>
                    <img src={url} alt={`Choice ${String.fromCharCode(65 + i)}`} className="h-36 w-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-slate-700 shadow">{String.fromCharCode(65 + i)}</span>
                    {showFeedbackForCurrent && isThisCorrect && <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20"><CheckCircle2 className="h-10 w-10 text-emerald-600" /></div>}
                    {showFeedbackForCurrent && isThisSelected && !isThisCorrect && <div className="absolute inset-0 flex items-center justify-center bg-red-500/20"><XCircle className="h-10 w-10 text-red-600" /></div>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Text choices */}
          {current.type !== "image" && current.type !== "romaji_input" && (
            <div className="space-y-3">
              {current.choices.map((choice, i) => {
                const isThisSelected = currentSelected === i;
                const isThisCorrect = i === current.correctIndex;
                let cardClass = "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50";
                if (showFeedbackForCurrent) {
                  if (isThisCorrect) cardClass = "border-emerald-500 bg-emerald-50";
                  else if (isThisSelected) cardClass = "border-red-500 bg-red-50";
                  else cardClass = "border-slate-200 opacity-50";
                }
                const choiceRm = current.choiceRomaji?.[i] ?? "";
                const isJapaneseChoice = current.type === "translate_en_jp" || current.type === "sentence_en_jp" || current.type === "listen" || current.type === "romaji_hiragana";
                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={showFeedbackForCurrent || isReviewMode} className={`flex w-full items-center gap-3 rounded-xl border-2 px-5 py-4 text-left transition ${cardClass}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${showFeedbackForCurrent && isThisCorrect ? "border-emerald-600 bg-emerald-600 text-white" : showFeedbackForCurrent && isThisSelected ? "border-red-600 bg-red-600 text-white" : "border-slate-300 text-slate-400"}`}>{String.fromCharCode(65 + i)}</span>
                    <span className="flex flex-col">
                      {isJapaneseChoice && choiceRm && <span className="text-xs text-slate-400">{choiceRm}</span>}
                      <span className="text-base font-medium text-slate-800">{choice}</span>
                    </span>
                    {showFeedbackForCurrent && isThisCorrect && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-500" />}
                    {showFeedbackForCurrent && isThisSelected && !isThisCorrect && <XCircle className="ml-auto h-5 w-5 text-red-500" />}
                  </button>
                );
              })}
            </div>
          )}

          {current.type === "listen" && !showFeedbackForCurrent && !isReviewMode && (
            <button onClick={handleSkipListening} className="mt-4 inline-flex items-center gap-2 self-center text-sm text-slate-400 transition hover:text-slate-600">
              <VolumeX className="h-4 w-4" /> Can't listen right now
            </button>
          )}
        </div>

        {/* Feedback drawer */}
        {showFeedbackForCurrent && !isReviewMode && (
          <div className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-slate-200 bg-white p-4 shadow-lg sm:rounded-t-2xl">
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <><div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div><div><p className="text-sm font-semibold text-emerald-700">Correct!</p><p className="text-xs text-slate-500">{current.english}</p></div></>
                ) : isSkipped ? (
                  <><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><VolumeX className="h-6 w-6 text-slate-400" /></div><div><p className="text-sm font-semibold text-slate-600">Skipped.</p><p className="text-xs text-slate-500">No audio played.</p></div></>
                ) : (
                  <><div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"><XCircle className="h-6 w-6 text-red-600" /></div><div><p className="text-sm font-semibold text-red-700">Incorrect.</p><p className="text-xs text-slate-500">Correct answer: {current.type === "romaji_input" ? current.answerText : current.choices[current.correctIndex]}</p></div></>
                )}
              </div>
              <button onClick={() => advance()} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {!showFeedbackForCurrent && (
          <div className="flex items-center justify-between py-4">
            <button onClick={goPrev} disabled={currentIdx === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40">
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            <button onClick={goNext} disabled={!currentIsAnswered || currentIdx === questions.length - 1} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-40">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {isReviewMode && (
          <div className="flex items-center justify-between py-4">
            <button onClick={goPrev} disabled={currentIdx === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40">
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            <span className="text-xs text-slate-400">Swipe or use arrows to navigate</span>
            <button onClick={goNext} disabled={currentIdx === questions.length - 1} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-40">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {exitConfirm && <ExitConfirmModal onConfirm={() => { setShowExitConfirm(false); if (isReviewMode) setPhase("results"); else onExit(); }} onCancel={() => setShowExitConfirm(false)} isReview={isReviewMode} />}
      </div>
    );
  }

  // ---------- RESULTS PHASE ----------
  if (phase === "results" && result) {
    const heading = isTestMode ? "Test Complete!" : isPractice ? "Practice Complete!" : "Lesson Complete!";
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{heading}</h2>
          <p className="mt-1 text-sm text-slate-500">Day {day.day} · {day.title}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mx-auto sm:max-w-md">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{Math.round(result.percentage)}%</p>
              <p className="text-xs text-slate-500">Accuracy</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{formatDuration(durationRef.current)}</p>
              <p className="text-xs text-slate-500">Time taken</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">{saved ? "Your results have been saved." : submitting ? "Saving your results..." : "Saving..."}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => { setCurrentIdx(0); setPhase("review"); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700">
            Review Quiz Attempt
          </button>
          <button onClick={() => { onComplete?.(); onExit(); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <RotateCcw className="h-4 w-4" /> Back to Learning Path
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ---------- SENTENCE DISPLAY WITH STRICT RUBY ALIGNMENT ----------
function SentenceDisplay({ sentence }: { sentence: SentenceItem }) {
  const segments = sentence.segments ?? [];
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {/* Strict vertical ruby: each segment is inline-flex flex-col, centered */}
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {segments.map((seg, i) => (
              <span key={i} className="inline-flex flex-col items-center" style={{ lineHeight: 1.2 }}>
                <span className="text-xs text-slate-400">{seg.romaji}</span>
                <span className="text-base font-semibold text-slate-900">{seg.hiragana}</span>
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-sm text-slate-500">{sentence.english}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {segments.map((seg, i) => (
              <WordTooltip key={i} text={seg.english} japaneseText={seg.hiragana} />
            ))}
          </div>
        </div>
        <button onClick={() => speak(sentence.hiragana)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition hover:bg-teal-100">
          <Volume2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------- WORD TOOLTIP ----------
function WordTooltip({ text, japaneseText }: { text: string; japaneseText?: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="cursor-help border-b border-dashed border-slate-300 text-slate-600">
        {japaneseText && <span className="text-sm font-medium text-slate-700">{japaneseText} </span>}
        <span className="text-xs text-slate-400">?</span>
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

// ---------- EXIT CONFIRM MODAL ----------
function ExitConfirmModal({ onConfirm, onCancel, isReview }: { onConfirm: () => void; onCancel: () => void; isReview?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
          <h3 className="text-base font-semibold text-slate-900">{isReview ? "Exit review?" : "Leave lesson?"}</h3>
        </div>
        <p className="mb-5 text-sm text-slate-500">{isReview ? "Are you sure you want to exit the review?" : "Are you sure you want to leave? Progress will be lost."}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">{isReview ? "Exit" : "Leave"}</button>
        </div>
      </div>
    </div>
  );
}
