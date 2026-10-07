import { useMemo } from "react";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import type { TopicState } from "@/lib/types";
import { retentionEstimate } from "@/lib/spacedRepetition";

interface Props {
  topicStates: TopicState[];
}

function todayStr(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export default function RetentionView({ topicStates }: Props) {
  const rows = useMemo(() => {
    const today = todayStr();
    return topicStates
      .map((t) => {
        const daysSince = t.last_studied
          ? daysBetween(t.last_studied, today)
          : 0;
        const retention = retentionEstimate(
          daysSince,
          t.interval_days,
          t.ease_factor
        );
        return { ...t, daysSince, retention };
      })
      .sort((a, b) => a.retention - b.retention);
  }, [topicStates]);

  const retentionBuckets = useMemo(() => {
    const buckets = [
      { label: "Critical (<20%)", count: 0, color: "bg-red-500" },
      { label: "Low (20–40%)", count: 0, color: "bg-orange-500" },
      { label: "Moderate (40–60%)", count: 0, color: "bg-amber-500" },
      { label: "Good (60–80%)", count: 0, color: "bg-teal-500" },
      { label: "Strong (>80%)", count: 0, color: "bg-emerald-500" },
    ];
    for (const r of rows) {
      const p = r.retention * 100;
      if (p < 20) buckets[0].count++;
      else if (p < 40) buckets[1].count++;
      else if (p < 60) buckets[2].count++;
      else if (p < 80) buckets[3].count++;
      else buckets[4].count++;
    }
    return buckets;
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <Activity className="h-4 w-4 text-teal-600" />
          <h3 className="text-base font-semibold text-slate-900">
            Ebbinghaus Retention Estimates
          </h3>
        </div>
        <p className="mb-5 text-sm text-slate-500">
          Retention is estimated using the exponential forgetting curve
          R(t) = e^(−t / S), where stability S = interval × easiness factor.
          Lower retention means the topic needs review sooner.
        </p>

        {rows.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-400">
            No data yet. Log sessions to see retention estimates.
          </div>
        ) : (
          <>
            {/* Retention distribution */}
            <div className="mb-6 space-y-2">
              {retentionBuckets.map((b) => {
                const max = Math.max(1, ...retentionBuckets.map((x) => x.count));
                const pct = (b.count / max) * 100;
                return (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-xs text-slate-500">
                      {b.label}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${b.color} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold text-slate-700">
                      {b.count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Per-topic retention bars */}
            <div className="space-y-3">
              {rows.map((r) => {
                const pct = Math.round(r.retention * 100);
                const tone =
                  pct < 20
                    ? "text-red-600"
                    : pct < 40
                    ? "text-orange-600"
                    : pct < 60
                    ? "text-amber-600"
                    : pct < 80
                    ? "text-teal-600"
                    : "text-emerald-600";
                const bar =
                  pct < 20
                    ? "bg-red-500"
                    : pct < 40
                    ? "bg-orange-500"
                    : pct < 60
                    ? "bg-amber-500"
                    : pct < 80
                    ? "bg-teal-500"
                    : "bg-emerald-500";
                return (
                  <div
                    key={`${r.student_id}-${r.topic}`}
                    className="rounded-lg border border-slate-100 p-3"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {r.topic}
                        </span>
                        {r.is_flagged && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                            <TrendingDown className="h-3 w-3" />
                            flagged
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{r.daysSince}d since study</span>
                        <span className={`font-semibold ${tone}`}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${bar} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
