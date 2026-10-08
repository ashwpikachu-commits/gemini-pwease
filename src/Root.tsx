import { useEffect, useState } from "react";
import type { StudySession, StudySessionInput, RegularTest } from "@/lib/types";
import { fetchAllSessions, fetchRegularTests, insertSession, insertPracticeSession, insertRegularTest, deleteSession } from "@/lib/api";
import { getLoggedInStudentId } from "@/lib/auth";
import LoginScreen from "@/components/LoginScreen";
import App from "@/App";

export default function Root() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [regularTests, setRegularTests] = useState<RegularTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authedStudentId, setAuthedStudentId] = useState<string | null>(
    getLoggedInStudentId()
  );

  const load = async () => {
    try {
      setError(null);
      const [rows, tests] = await Promise.all([fetchAllSessions(), fetchRegularTests(getLoggedInStudentId() ?? "")]);
      setSessions(rows);
      setRegularTests(tests);
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

  const handleAddPractice = async (input: {
    student_id: string;
    topic: string;
    score: number;
    accuracy_pct: number;
    duration_seconds: number;
    days_included: string;
    question_count: number;
  }) => {
    try {
      setError(null);
      await insertPracticeSession(input);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save practice session");
      throw e;
    }
  };

  const handleAddTest = async (input: {
    student_id: string;
    test_number: number;
    topic: string;
    score: number;
    accuracy_pct: number;
    duration_seconds: number;
    question_count: number;
  }) => {
    try {
      setError(null);
      await insertRegularTest(input);
      // Reload sessions so LearningPath sees the completed test
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save test result");
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
      regularTests={regularTests}
      loading={loading}
      error={error}
      onAdd={handleAdd}
      onDelete={handleDelete}
      onAddPractice={handleAddPractice}
      onAddTest={handleAddTest}
    />
  );
}
