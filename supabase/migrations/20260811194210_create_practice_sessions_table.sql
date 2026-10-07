/*
# Create practice_sessions table

1. Purpose
   - Stores completed practice quiz results separately from the main SM-2 study_sessions table.
   - This protects the main spaced-repetition schedule from being polluted by practice attempts.
   - Only the FIRST attempt of a daily lesson is logged to study_sessions; practice quizzes go here.

2. New Tables
   - `practice_sessions`
     - `id` (uuid, primary key)
     - `student_id` (text, not null) — the logged-in student identifier
     - `topic` (text, not null) — description of the practice session (e.g. "Practice: Days 1-3")
     - `score` (integer, not null) — SM-2 quality score 0-5
     - `accuracy_pct` (integer, default 0) — percentage correct
     - `duration_seconds` (integer, default 0) — time spent on the practice quiz
     - `days_included` (text) — comma-separated day numbers included (e.g. "1,2,3")
     - `question_count` (integer, default 0) — total questions in the practice quiz
     - `studied_at` (date, default today) — date the practice was completed
     - `created_at` (timestamptz, default now) — record creation timestamp

3. Security
   - Enable RLS on `practice_sessions`.
   - Allow anon + authenticated CRUD since this is a research study app with no auth screen;
     the student_id field provides logical separation per student.
*/

CREATE TABLE IF NOT EXISTS practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  topic text NOT NULL,
  score integer NOT NULL,
  accuracy_pct integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  days_included text NOT NULL DEFAULT '',
  question_count integer NOT NULL DEFAULT 0,
  studied_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_practice_sessions" ON practice_sessions;
CREATE POLICY "anon_select_practice_sessions"
ON practice_sessions FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_practice_sessions" ON practice_sessions;
CREATE POLICY "anon_insert_practice_sessions"
ON practice_sessions FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_practice_sessions" ON practice_sessions;
CREATE POLICY "anon_update_practice_sessions"
ON practice_sessions FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_practice_sessions" ON practice_sessions;
CREATE POLICY "anon_delete_practice_sessions"
ON practice_sessions FOR DELETE
TO anon, authenticated USING (true);
