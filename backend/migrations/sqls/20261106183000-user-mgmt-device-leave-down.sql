-- T019 Revert

DROP TABLE IF EXISTS leave_requests;
DROP TYPE IF EXISTS leave_request_status;

ALTER TABLE courses
    DROP COLUMN IF EXISTS max_absences,
    DROP COLUMN IF EXISTS total_sessions;

DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_device_id;

ALTER TABLE users
    DROP COLUMN IF EXISTS is_locked,
    DROP COLUMN IF EXISTS device_id,
    DROP COLUMN IF EXISTS email,
    DROP COLUMN IF EXISTS full_name;
