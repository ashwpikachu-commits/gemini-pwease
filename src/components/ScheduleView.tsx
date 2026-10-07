import { useMemo } from "react";
import { AlertTriangle, Clock, Flame, CheckCircle2, CalendarClock } from "lucide-react";
import type { TopicState } from "@/lib/types";

interface Props {
  topicStates: TopicState[];
}

function todayStr(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function daysUntil(date: string): number {
  const today = todayStr();
  const da = new Date(today + "T00:00:00");
  const db = new Date(date + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

interface ScheduleRow extends TopicState {
  days_until_review: number;
  is_overdue: boolean;
  priority_score: number;
}

export default function ScheduleView({ topicStates }: Props) {
  const rows = useMemo<ScheduleRow[]>(() => {
    const enriched = topicStates.map((t) => {
      const d = daysUntil(t.next_review);
      const overdue = d < 0;
      const flagBoost = t.is_flagged ? 100 : 0;
      const overdueBoost = overdue ? Math.abs(d) * 10 : 0;
      const soonBoost = d >= 0 && d <= 1 ? 50 : 0;
      const lowScoreBoost = t.average_score < 3 ? 20 : 0;
      const priority = flagBoost + overdueBoost + soonBoost + lowScoreBoost;
      return {
        ...t,
        days_until_review: d,
        is_overdue: overdue,
        priority_score: priority,
      };
    });
    return enriched.sort((a, b) => b.priority_score - a.priority_score);
  }, [topicStates]);

  const flagged = rows.filter((r) => r.is_flagged);
  const overdue = rows.filter((r) => r.is_overdue);
  const upcoming = rows.filter((r) => !r.is_overdue && r.days_until_review >= 0 && r.days_until_review <= 7);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Flagged Topics"
          value={flagged.length}
          tone="amber"
          hint="Avg score < 3"
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5" />}
          label="Overdue Reviews"
          value={overdue.length}
          tone="red"
          hint="Past due date"
        />
        <SummaryCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Due This Week"
          value={upcoming.length}
          tone="teal"
          hint="Within 7 days"
        />
      </div>

      {flagged.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-700">
            <Flame className="h-4 w-4" />
            <h3 className="text-sm font-semibold">
              Priority — Flagged for extra review
            </h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {flagged.map((r) => (
              <div
                key={`${r.student_id}-${r.topic}`}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium text-slate-800">{r.topic}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-amber-700">
                    avg {r.average_score}/5
                  </div>
                  <div className="text-xs text-slate-400">
                    {r.recent_scores.join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">
            Upcoming Review Schedule
          </h3>
          <p className="text-sm text-slate-500">
            Sorted by priority — flagged and overdue topics appear first.
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-400">
            No sessions logged yet. Log a session to generate a schedule.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Priority</th>
                  <th className="px-5 py-3 font-medium">Topic</th>
                  <th className="px-5 py-3 font-medium">Next Review</th>
                  <th className="px-5 py-3 font-medium">Avg</th>
                  <th className="px-5 py-3 font-medium">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={`${r.student_id}-${r.topic}`}
                    className="border-b border-slate-50 transition hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3">
                      {r.is_flagged ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          Flagged
                        </span>
                      ) : r.is_overdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          <Clock className="h-3 w-3" />
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          On track
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-800">{r.topic}</td>
                    <td className="px-5 py-3">
                      <div className="text-slate-700">{r.next_review}</div>
                      <div
                        className={`text-xs ${
                          r.is_overdue
                            ? "text-red-500"
                            : r.days_until_review <= 1
                            ? "text-amber-600"
                            : "text-slate-400"
                        }`}
                      >
                        {r.is_overdue
                          ? `${Math.abs(r.days_until_review)}d overdue`
                          : r.days_until_review === 0
                          ? "Due today"
                          : `in ${r.days_until_review}d`}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`font-medium ${
                          r.average_score < 3
                            ? "text-amber-600"
                            : "text-slate-700"
                        }`}
                      >
                        {r.average_score}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {r.session_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "amber" | "red" | "teal";
  hint: string;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
    teal: "bg-teal-50 text-teal-600 border-teal-200",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${tones[tone]}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-400">{hint}</div>
    </div>
  );
}
