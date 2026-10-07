import type { StudySession } from "./types";

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function sessionsToCsv(sessions: StudySession[]): string {
  const headers = [
    "id",
    "student_id",
    "group_label",
    "topic",
    "score",
    "accuracy_pct",
    "duration_seconds",
    "ease_factor",
    "repetition",
    "interval_days",
    "next_review",
    "studied_at",
    "created_at",
  ];
  const rows = sessions.map((s) =>
    [
      s.id,
      s.student_id,
      s.group_label,
      s.topic,
      s.score,
      s.accuracy_pct,
      s.duration_seconds,
      s.ease_factor,
      s.repetition,
      s.interval_days,
      s.next_review,
      s.studied_at,
      s.created_at,
    ]
      .map((v) => escapeCsv(String(v)))
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function downloadCsv(sessions: StudySession[], filename: string): void {
  const csv = sessionsToCsv(sessions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
