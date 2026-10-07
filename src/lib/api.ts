import { supabase } from "./supabase";
import type { StudySession, StudySessionInput, PracticeSession, PracticeSessionInput } from "./types";
import { computeNextForInput } from "./spacedRepetition";

export async function fetchAllSessions(): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .order("studied_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as StudySession[];
}

export async function insertSession(
  input: StudySessionInput,
  priorSessions: StudySession[]
): Promise<StudySession> {
  const sm2 = computeNextForInput(input, priorSessions);
  const row = {
    student_id: input.student_id,
    group_label: input.group_label,
    topic: input.topic,
    score: input.score,
    accuracy_pct: input.accuracy_pct ?? 0,
    duration_seconds: input.duration_seconds ?? 0,
    ease_factor: sm2.ease_factor,
    repetition: sm2.repetition,
    interval_days: sm2.interval_days,
    next_review: sm2.next_review,
  };
  const { data, error } = await supabase
    .from("study_sessions")
    .insert(row)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Insert returned no data");
  return data as StudySession;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase
    .from("study_sessions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function fetchPracticeSessions(studentId: string): Promise<PracticeSession[]> {
  const { data, error } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("student_id", studentId)
    .order("studied_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PracticeSession[];
}

export async function insertPracticeSession(
  input: PracticeSessionInput
): Promise<PracticeSession> {
  const row = {
    student_id: input.student_id,
    topic: input.topic,
    score: input.score,
    accuracy_pct: input.accuracy_pct ?? 0,
    duration_seconds: input.duration_seconds ?? 0,
    days_included: input.days_included ?? "",
    question_count: input.question_count ?? 0,
  };
  const { data, error } = await supabase
    .from("practice_sessions")
    .insert(row)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Insert returned no data");
  return data as PracticeSession;
}
