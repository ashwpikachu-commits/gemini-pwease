import { useEffect, useState } from "react";
import type { StudySession, StudySessionInput } from "@/lib/types";
import { fetchAllSessions, insertSession, deleteSession } from "@/lib/api";
import { getLoggedInStudentId } from "@/lib/auth";
import LoginScreen from "@/components/LoginScreen";
import App from "@/App";

export default function Root() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authedStudentId, setAuthedStudentId] = useState<string | null>(
    getLoggedInStudentId()
  );

  const load = async () => {
    try {
      setError(null);
      const rows = await fetchAllSessions();
      setSessions(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authedStudentId) {
      load();
    } else {
      setLoading(false);
    }
  }, [authedStudentId]);

  const handleAdd = async (input: StudySessionInput) => {
    try {
      setError(null);
      const created = await insertSession(input, sessions);
      setSessions((prev) =>
        [...prev, created].sort(
          (a, b) =>
            new Date(a.studied_at).getTime() - new Date(b.studied_at).getTime()
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add session");
      throw e;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete session");
      throw e;
    }
  };

  if (!authedStudentId) {
    return <LoginScreen onLogin={(sid) => setAuthedStudentId(sid)} />;
  }

  return (
    <App
      sessions={sessions}
      loading={loading}
      error={error}
      onAdd={handleAdd}
      onDelete={handleDelete}
    />
  );
}
