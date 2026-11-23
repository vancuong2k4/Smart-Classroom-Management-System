-- Bổ sung số thứ tự buổi học (session_number) cho bảng sessions
ALTER TABLE sessions 
    ADD COLUMN IF NOT EXISTS session_number INTEGER NOT NULL DEFAULT 1 
    CONSTRAINT chk_session_number CHECK (session_number > 0);

CREATE INDEX IF NOT EXISTS idx_sessions_course_session_number ON sessions(course_id, session_number);

-- Đồng bộ lại số thứ tự buổi học cho các phiên đã có trong DB
WITH ranked_sessions AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY start_time ASC) as rn
    FROM sessions
)
UPDATE sessions
SET session_number = ranked_sessions.rn
FROM ranked_sessions
WHERE sessions.id = ranked_sessions.id;
