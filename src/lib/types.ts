export type GroupLabel = "A" | "B";

export interface StudySession {
  id: string;
  student_id: string;
  group_label: GroupLabel;
  topic: string;
  score: number;
  accuracy_pct: number;
  ease_factor: number;
  repetition: number;
  interval_days: number;
  next_review: string;
  duration_seconds: number;
  studied_at: string;
  created_at: string;
}

export interface StudySessionInput {
  student_id: string;
  group_label: GroupLabel;
  topic: string;
  score: number;
  accuracy_pct?: number;
  duration_seconds?: number;
}

export interface PracticeSession {
  id: string;
  student_id: string;
  topic: string;
  score: number;
  accuracy_pct: number;
  duration_seconds: number;
  days_included: string;
  question_count: number;
  studied_at: string;
  created_at: string;
}

export interface PracticeSessionInput {
  student_id: string;
  topic: string;
  score: number;
  accuracy_pct?: number;
  duration_seconds?: number;
  days_included?: string;
  question_count?: number;
}

export interface TopicState {
  student_id: string;
  topic: string;
  ease_factor: number;
  repetition: number;
  interval_days: number;
  last_score: number;
  last_studied: string;
  next_review: string;
  session_count: number;
  recent_scores: number[];
  average_score: number;
  is_flagged: boolean;
  retention_estimate: number;
}

export interface ScheduleItem {
  student_id: string;
  topic: string;
  group_label: GroupLabel;
  next_review: string;
  days_until_review: number;
  is_overdue: boolean;
  is_flagged: boolean;
  priority_score: number;
  ease_factor: number;
  average_score: number;
  session_count: number;
}
