import { useMemo, useState } from "react";
import { Trash2, Search, Download } from "lucide-react";
import type { StudySession } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";

interface Props {
  sessions: StudySession[];
  onDelete: (id: string) => Promise<void>;
}

export default function SessionsTable({ sessions, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return sessions
      .filter((s) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          s.student_id.toLowerCase().includes(q) ||
          s.topic.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.studied_at).getTime() - new Date(a.studied_at).getTime()
      );
  }, [sessions, query]);

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setConfirmId(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            All Study Sessions
          </h3>
          <p className="text-sm text-slate-500">
            {filtered.length} of {sessions.length} sessions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student or topic…"
              className="w-56 rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <button
            onClick={() => downloadCsv(filtered, `study_sessions_filtered_${Date.now()}.csv`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          No sessions match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Topic</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Ease</th>
                <th className="px-5 py-3 font-medium">Rep</th>
                <th className="px-5 py-3 font-medium">Interval</th>
                <th className="px-5 py-3 font-medium">Next Review</th>
                <th className="px-5 py-3 font-medium">Studied</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-50 transition hover:bg-slate-50/60"
                >
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {s.student_id}
                  </td>
                  <td className="px-5 py-3 text-slate-800">{s.topic}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`font-semibold ${
                        s.score < 3
                          ? "text-amber-600"
                          : s.score >= 4
                          ? "text-emerald-600"
                          : "text-slate-700"
                      }`}
                    >
                      {s.score}/5
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {Math.floor(s.duration_seconds / 60)}m {s.duration_seconds % 60}s
                  </td>
                  <td className="px-5 py-3 text-slate-600">{s.ease_factor}</td>
                  <td className="px-5 py-3 text-slate-600">{s.repetition}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {s.interval_days}d
                  </td>
                  <td className="px-5 py-3 text-slate-700">{s.next_review}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {s.studied_at.slice(0, 10)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {confirmId === s.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(s.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
