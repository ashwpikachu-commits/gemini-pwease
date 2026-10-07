/*
# Add duration_seconds column to study_sessions

1. Purpose
   Supports the ISEF research experiment's silent session-duration tracking.
   The frontend starts a hidden timer when a student opens a lesson and logs
   the total elapsed time (in seconds) to the database upon lesson completion.
   The timer is never displayed to the student.

2. Modified Tables
   - `study_sessions`
     - Add column `duration_seconds` (int, NOT NULL, default 0)
       Stores the total elapsed study time in seconds for each session.

3. Security
   - No RLS or policy changes. The existing anon + authenticated CRUD policies
     already cover the new column (row-level, not column-level).

4. Notes
   - The column defaults to 0 so existing rows and any insert that omits it
     remain valid.
   - Idempotent: uses a DO block to check information_schema before adding.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_sessions'
      AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE study_sessions
      ADD COLUMN duration_seconds int NOT NULL DEFAULT 0;
  END IF;
END $$;
