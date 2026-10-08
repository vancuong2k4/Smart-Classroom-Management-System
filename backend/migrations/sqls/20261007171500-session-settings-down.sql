DROP INDEX IF EXISTS idx_sessions_course_time;

ALTER TABLE attendance_records ALTER COLUMN scanned_ip TYPE VARCHAR(50) USING scanned_ip::text;
ALTER TABLE sessions ALTER COLUMN ip_range TYPE VARCHAR(50) USING ip_range::text;

ALTER TABLE sessions
    DROP CONSTRAINT IF EXISTS chk_sessions_time,
    DROP COLUMN IF EXISTS closed_at,
    DROP COLUMN IF EXISTS late_after_minutes,
    DROP COLUMN IF EXISTS radius_meters;
