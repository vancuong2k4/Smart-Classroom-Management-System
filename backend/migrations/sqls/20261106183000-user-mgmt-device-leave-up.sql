-- T019: Quản lý người dùng, Device Binding, Đơn xin nghỉ phép và Cấu hình số buổi học

-- 1. Bổ sung thông tin cho bảng users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS device_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Bổ sung cấu hình số buổi học và giới hạn vắng cho bảng courses
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS total_sessions INTEGER NOT NULL DEFAULT 10
        CONSTRAINT chk_courses_total_sessions CHECK (total_sessions > 0),
    ADD COLUMN IF NOT EXISTS max_absences INTEGER NOT NULL DEFAULT 2
        CONSTRAINT chk_courses_max_absences CHECK (max_absences >= 0);

-- 3. Bổ sung giá trị EXCUSED vào ENUM attendance_status
ALTER TYPE attendance_status ADD VALUE IF NOT EXISTS 'EXCUSED';

-- 4. Tạo bảng đơn xin nghỉ phép (leave_requests)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_request_status') THEN
        CREATE TYPE leave_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    proof_image_url TEXT,
    status leave_request_status NOT NULL DEFAULT 'PENDING',
    review_note TEXT,
    requested_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_course ON leave_requests(course_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_student ON leave_requests(student_id, course_id);
