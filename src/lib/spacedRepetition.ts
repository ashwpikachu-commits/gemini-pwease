import type { StudySession, StudySessionInput, TopicState } from "./types";

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

export interface Sm2Result {
  ease_factor: number;
  repetition: number;
  interval_days: number;
  next_review: string;
}

export interface PersonalizationFactors {
  learning_trajectory: number;
  retention_urgency: number;
  consistency: number;
  personalization_multiplier: number;
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function applySm2(
  score: number,
  prev: { ease_factor: number; repetition: number; interval_days: number }
): Sm2Result {
  const prevEase = prev.ease_factor || DEFAULT_EASE;
  const prevRep = prev.repetition || 0;
  const prevInterval = prev.interval_days || 0;

  let repetition: number;
  let interval: number;

  if (score >= 3) {
    if (prevRep === 0) interval = 1;
    else if (prevRep === 1) interval = 6;
    else interval = Math.round(prevInterval * prevEase);
    repetition = prevRep + 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  const q = score;
  let ease = prevEase + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease < MIN_EASE) ease = MIN_EASE;

  return {
    ease_factor: Math.round(ease * 100) / 100,
    repetition,
    interval_days: interval,
    next_review: todayPlus(interval),
  };
}

export function retentionEstimate(
  daysSinceStudy: number,
  intervalDays: number,
  easeFactor: number
): number {
  const stability = Math.max(1, intervalDays * easeFactor);
  const t = Math.max(0, daysSinceStudy);
  return Math.exp(-t / stability);
}

export function isFlagged(recentScores: number[], sessionCount: number): boolean {
  if (sessionCount < 2 || recentScores.length === 0) return false;
  const avg =
    recentScores.reduce((s, v) => s + v, 0) / recentScores.length;
  return avg < 3;
}

export function computePersonalization(
  recentScores: number[],
  retention: number,
  sessionCount: number
): PersonalizationFactors {
  let trajectory = 0;
  if (recentScores.length >= 2) {
    const half = Math.floor(recentScores.length / 2);
    const early = recentScores.slice(0, half);
    const late = recentScores.slice(half);
    const earlyAvg = early.reduce((s, v) => s + v, 0) / early.length;
    const lateAvg = late.reduce((s, v) => s + v, 0) / late.length;
    trajectory = lateAvg - earlyAvg;
  }

  const learning_trajectory = Math.max(-1, Math.min(1, trajectory / 5));

  const retention_urgency = 1 - retention;

  let consistency = 1;
  if (recentScores.length >= 2) {
    const mean = recentScores.reduce((s, v) => s + v, 0) / recentScores.length;
    const variance =
      recentScores.reduce((s, v) => s + (v - mean) ** 2, 0) /
      recentScores.length;
    consistency = Math.max(0.5, 1 - Math.sqrt(variance) / 5);
  }

  const sessionFactor = Math.min(1, sessionCount / 5);

  const personalization_multiplier = Math.round(
    (1 +
      learning_trajectory * 0.15 +
      retention_urgency * 0.2 -
      (1 - consistency) * 0.1 -
      sessionFactor * 0.05) *
      100
  ) / 100;

  return {
    learning_trajectory: Math.round(learning_trajectory * 100) / 100,
    retention_urgency: Math.round(retention_urgency * 100) / 100,
    consistency: Math.round(consistency * 100) / 100,
    personalization_multiplier: Math.max(0.5, Math.min(1.5, personalization_multiplier)),
  };
}

export function applyPersonalizedSm2(
  score: number,
  prev: { ease_factor: number; repetition: number; interval_days: number },
  factors: PersonalizationFactors
): Sm2Result {
  const base = applySm2(score, prev);
  const adjustedInterval = Math.max(
    1,
    Math.round(base.interval_days * factors.personalization_multiplier)
  );
  return {
    ...base,
    interval_days: adjustedInterval,
    next_review: todayPlus(adjustedInterval),
  };
}

export function buildTopicState(
  studentId: string,
  topic: string,
  sessions: StudySession[]
): TopicState {
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(a.studied_at).getTime() - new Date(b.studied_at).getTime()
  );
  const latest = sorted[sorted.length - 1];
  const recent = sorted.slice(-3).map((s) => s.score);
  const avg =
    sorted.reduce((s, v) => s + v.score, 0) / Math.max(1, sorted.length);

  const today = todayPlus(0);
  const daysSince = latest
    ? daysBetween(latest.studied_at.slice(0, 10), today)
    : 0;
  const retention = latest
    ? retentionEstimate(
        daysSince,
        latest.interval_days,
        latest.ease_factor
      )
    : 1;

  return {
    student_id: studentId,
    topic,
    ease_factor: latest?.ease_factor ?? DEFAULT_EASE,
    repetition: latest?.repetition ?? 0,
    interval_days: latest?.interval_days ?? 0,
    last_score: latest?.score ?? 0,
    last_studied: latest?.studied_at.slice(0, 10) ?? "",
    next_review: latest?.next_review ?? today,
    session_count: sorted.length,
    recent_scores: recent,
    average_score: Math.round(avg * 100) / 100,
    is_flagged: isFlagged(recent, sorted.length),
    retention_estimate: Math.round(retention * 100) / 100,
  };
}

export function computeNextForInput(
  input: StudySessionInput,
  priorSessions: StudySession[]
): Sm2Result {
  const prior = priorSessions
    .filter(
      (s) => s.student_id === input.student_id && s.topic === input.topic
    )
    .sort(
      (a, b) =>
        new Date(a.studied_at).getTime() - new Date(b.studied_at).getTime()
    );
  const last = prior[prior.length - 1];
  const recentScores = prior.slice(-3).map((s) => s.score);

  const today = todayPlus(0);
  const daysSince = last
    ? daysBetween(last.studied_at.slice(0, 10), today)
    : 0;
  const retention = last
    ? retentionEstimate(daysSince, last.interval_days, last.ease_factor)
    : 1;

  const factors = computePersonalization(
    recentScores,
    retention,
    prior.length
  );

  return applyPersonalizedSm2(
    input.score,
    {
      ease_factor: last?.ease_factor ?? DEFAULT_EASE,
      repetition: last?.repetition ?? 0,
      interval_days: last?.interval_days ?? 0,
    },
    factors
  );
}
