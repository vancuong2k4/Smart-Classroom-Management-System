DROP INDEX IF EXISTS idx_sessions_course_session_number;
ALTER TABLE sessions DROP COLUMN IF EXISTS session_number;
