/*
# Create regular_tests table

1. Purpose
   - Stores results from formal bi-daily assessment tests (Regular Test 1/2/3) separately
     from daily study_sessions and practice_sessions.
   - This prevents test results from contaminating the SM-2 spaced-repetition schedule
     or the practice analytics data.

2. New Tables
   - `regular_tests`
     - `id` (uuid, primary key)
     - `student_id` (text, not null) — the logged-in student identifier
     - `test_number` (integer, not null) — which test (1, 2, or 3)
     - `topic` (text, not null) — e.g. "Regular Test 1"
     - `score` (integer, not null) — SM-2 quality score 0-5
     - `accuracy_pct` (integer, default 0) — percentage correct
     - `duration_seconds` (integer, default 0) — time spent on the test
     - `question_count` (integer, default 0) — total questions in the test
     - `studied_at` (date, default today) — date the test was completed
     - `created_at` (timestamptz, default now) — record creation timestamp

3. Security
   - Enable RLS on `regular_tests`.
   - Allow anon + authenticated CRUD since this is a research study app with no auth screen;
     the student_id field provides logical separation per student.
*/

CREATE TABLE IF NOT EXISTS regular_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  test_number integer NOT NULL,
  topic text NOT NULL,
  score integer NOT NULL,
  accuracy_pct integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  question_count integer NOT NULL DEFAULT 0,
  studied_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE regular_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_regular_tests" ON regular_tests;
CREATE POLICY "anon_select_regular_tests"
ON regular_tests FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_regular_tests" ON regular_tests;
CREATE POLICY "anon_insert_regular_tests"
ON regular_tests FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_regular_tests" ON regular_tests;
CREATE POLICY "anon_update_regular_tests"
ON regular_tests FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_regular_tests" ON regular_tests;
CREATE POLICY "anon_delete_regular_tests"
ON regular_tests FOR DELETE
TO anon, authenticated USING (true);
