import { useMemo } from "react";
import { Users, BookOpen, GraduationCap, AlertTriangle } from "lucide-react";
import type { StudySession, TopicState } from "@/lib/types";

interface Props {
  sessions: StudySession[];
  topicStates: TopicState[];
}

export default function StatsView({ sessions, topicStates }: Props) {
  const stats = useMemo(() => {
    const scoreDist = [0, 0, 0, 0, 0, 0];
    for (const session of sessions) scoreDist[session.score]++;
    return {
      total: sessions.length,
      students: new Set(sessions.map((s) => s.student_id)).size,
      topics: new Set(sessions.map((s) => s.topic)).size,
      flagged: topicStates.filter((t) => t.is_flagged).length,
      scoreDist,
    };
  }, [sessions, topicStates]);

  const maxDist = Math.max(1, ...stats.scoreDist);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Students" value={stats.students} tone="teal" />
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Topics" value={stats.topics} tone="cyan" />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Total Sessions" value={stats.total} tone="slate" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Flagged Topics" value={stats.flagged} tone="amber" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-slate-900">Score Distribution</h3>
        <p className="mb-5 text-sm text-slate-500">How sessions are spread across performance scores.</p>
        <div className="flex h-40 items-end justify-between gap-2">
          {stats.scoreDist.map((count, score) => (
            <div key={score} className="flex h-full flex-1 flex-col items-center gap-1">
              <span className="text-xs font-semibold text-slate-600">{count}</span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-teal-500 to-cyan-400 transition-all"
                  style={{ height: `${Math.max(2, (count / maxDist) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">Per-Student Summary</h3>
        </div>
        <PerStudentTable sessions={sessions} />
      </div>
    </div>
  );
}

function PerStudentTable({ sessions }: { sessions: StudySession[] }) {
  const rows = useMemo(() => {
    const map = new Map<string, { student_id: string; count: number; total: number; topics: Set<string> }>();
    for (const session of sessions) {
      const row = map.get(session.student_id) ?? {
        student_id: session.student_id,
        count: 0,
        total: 0,
        topics: new Set<string>(),
      };
      row.count++;
      row.total += session.score;
      row.topics.add(session.topic);
      map.set(session.student_id, row);
    }
    return Array.from(map.values())
      .map((row) => ({ ...row, avg: row.count ? Math.round((row.total / row.count) * 100) / 100 : 0, topicCount: row.topics.size }))
      .sort((a, b) => a.student_id.localeCompare(b.student_id));
  }, [sessions]);

  if (rows.length === 0) {
    return <div className="flex h-32 items-center justify-center text-sm text-slate-400">No sessions logged yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-medium">Student</th>
            <th className="px-5 py-3 font-medium">Sessions</th>
            <th className="px-5 py-3 font-medium">Topics</th>
            <th className="px-5 py-3 font-medium">Avg Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.student_id} className="border-b border-slate-50 transition hover:bg-slate-50/60">
              <td className="px-5 py-3 font-medium text-slate-700">{row.student_id}</td>
              <td className="px-5 py-3 text-slate-600">{row.count}</td>
              <td className="px-5 py-3 text-slate-600">{row.topicCount}</td>
              <td className={`px-5 py-3 font-semibold ${row.avg < 3 ? "text-amber-600" : row.avg >= 4 ? "text-emerald-600" : "text-slate-700"}`}>
                {row.avg}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "teal" | "cyan" | "slate" | "amber";
}) {
  const tones = {
    teal: "bg-teal-50 text-teal-600 border-teal-200",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-200",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
