import type { LessonQuestion } from "./lessonGenerator";

const STORAGE_KEY = "fc_missed_questions";

export interface MissedQuestionRecord {
  questionId: string;
  studentId: string;
  sessionId: string;
  topic: string;
  prompt: string;
  hiragana: string;
  romaji: string;
  english: string;
  correctAnswer: string;
  userAnswer: string;
  directionLabel: string;
  type: string;
  loggedAt: string;
}

function readAll(): MissedQuestionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MissedQuestionRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: MissedQuestionRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

export function logMissedQuestions(
  studentId: string,
  sessionId: string,
  topic: string,
  questions: LessonQuestion[],
  answers: Record<string, number>
) {
  const existing = readAll();
  const newRecords: MissedQuestionRecord[] = [];
  for (const q of questions) {
    const userAnswer = answers[q.id];
    if (userAnswer === undefined) continue;
    if (userAnswer === q.correctIndex) continue;
    newRecords.push({
      questionId: q.id,
      studentId,
      sessionId,
      topic,
      prompt: q.prompt,
      hiragana: q.hiragana,
      romaji: q.romaji,
      english: q.english,
      correctAnswer: q.choices[q.correctIndex],
      userAnswer: q.choices[userAnswer],
      directionLabel: q.directionLabel,
      type: q.type,
      loggedAt: new Date().toISOString(),
    });
  }
  if (newRecords.length > 0) {
    writeAll([...existing, ...newRecords]);
  }
}

export function getMissedQuestions(studentId: string): MissedQuestionRecord[] {
  return readAll().filter((r) => r.studentId === studentId);
}

export function getMissedVocabKeys(studentId: string): string[] {
  const records = getMissedQuestions(studentId);
  const keys = new Set<string>();
  for (const r of records) {
    if (r.hiragana) keys.add(r.hiragana);
  }
  return Array.from(keys);
}

export function clearMissedQuestions(studentId: string) {
  const all = readAll();
  writeAll(all.filter((r) => r.studentId !== studentId));
}
