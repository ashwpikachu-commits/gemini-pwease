/*
# Create study_sessions table for ISEF research app

1. Purpose
   Stores study-session records for an ISEF research project on
   AI-personalized study schedules using SM-2 / Ebbinghaus forgetting curves.
   Each row is one study session: a student identifier, their experimental
   group (A = control, B = AI-scheduled), the topic studied, a 0-5
   performance score, and algorithm outputs (SM-2 easiness factor, repetition
   number, interval in days, and the computed next review date).

2. New Tables
   - `study_sessions`
     - id            (uuid, primary key)
     - student_id    (text, not null)  -- researcher-assigned student label
     - group_label   (text, not null)  -- 'A' or 'B'
     - topic         (text, not null)  -- subject / topic studied
     - score         (int, not null, 0-5) -- performance score
     - ease_factor   (real, not null, default 2.5) -- SM-2 easiness factor
     - repetition    (int, not null, default 0)  -- SM-2 repetition number
     - interval_days (int, not null, default 0)  -- SM-2 interval in days
     - next_review   (date, not null)              -- computed next review date
     - studied_at    (timestamptz, default now())  -- when the session happened
     - created_at    (timestamptz, default now())

3. Security
   - Enable RLS on `study_sessions`.
   - This is a single-tenant research data-collection app with no sign-in
     screen, so all CRUD is intentionally open to the anon + authenticated
     roles (the data is shared research data, not per-user private data).

4. Notes
   - No user_id / auth.users reference: no sign-in screen in this app.
   - `score` is constrained to 0-5 via a CHECK constraint.
   - `group_label` is constrained to 'A' or 'B' via a CHECK constraint.
   - Index on (student_id, topic) for the common "history per student/topic" query.
*/

CREATE TABLE IF NOT EXISTS study_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    text NOT NULL,
  group_label   text NOT NULL CHECK (group_label IN ('A', 'B')),
  topic         text NOT NULL,
  score         int  NOT NULL CHECK (score >= 0 AND score <= 5),
  ease_factor   real NOT NULL DEFAULT 2.5,
  repetition    int  NOT NULL DEFAULT 0,
  interval_days int  NOT NULL DEFAULT 0,
  next_review   date NOT NULL DEFAULT CURRENT_DATE,
  studied_at    timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_student_topic
  ON study_sessions (student_id, topic);

CREATE INDEX IF NOT EXISTS idx_study_sessions_next_review
  ON study_sessions (next_review);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_study_sessions" ON study_sessions;
CREATE POLICY "anon_select_study_sessions" ON study_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_study_sessions" ON study_sessions;
CREATE POLICY "anon_insert_study_sessions" ON study_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_study_sessions" ON study_sessions;
CREATE POLICY "anon_update_study_sessions" ON study_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_study_sessions" ON study_sessions;
CREATE POLICY "anon_delete_study_sessions" ON study_sessions FOR DELETE
  TO anon, authenticated USING (true);
