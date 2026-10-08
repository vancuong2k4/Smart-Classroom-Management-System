-- T005: Bổ sung cấu hình cho phiên điểm danh

-- 1. Cấu hình riêng cho từng phiên
ALTER TABLE sessions
    ADD COLUMN radius_meters INTEGER NOT NULL DEFAULT 50
        CONSTRAINT chk_sessions_radius CHECK (radius_meters BETWEEN 10 AND 1000),
    ADD COLUMN late_after_minutes INTEGER NOT NULL DEFAULT 10
        CONSTRAINT chk_sessions_late_after CHECK (late_after_minutes >= 0),
    -- Thời điểm GV đóng phiên thủ công (NULL = phiên tự hết hạn theo end_time)
    ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE,
    ADD CONSTRAINT chk_sessions_time CHECK (end_time > start_time);

-- 2. Dùng kiểu mạng chuyên dụng của PostgreSQL thay cho VARCHAR
--    => T006 có thể kiểm tra "IP SV có thuộc dải IP phòng học" bằng toán tử: scanned_ip <<= ip_range
ALTER TABLE sessions ALTER COLUMN ip_range TYPE CIDR USING ip_range::cidr;
ALTER TABLE attendance_records ALTER COLUMN scanned_ip TYPE INET USING scanned_ip::inet;

-- 3. Tăng tốc truy vấn "các phiên của lớp X, mới nhất trước" và "lớp X có phiên đang mở không"
CREATE INDEX idx_sessions_course_time ON sessions(course_id, start_time DESC);
