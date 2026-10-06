-- Gán giảng viên phụ trách cho mỗi lớp học.
-- ON DELETE SET NULL: nếu tài khoản giảng viên bị xóa, lớp vẫn giữ lại
-- (cùng toàn bộ lịch sử điểm danh) ở trạng thái "chưa phân công".
ALTER TABLE courses
    ADD COLUMN lecturer_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Tăng tốc truy vấn "các lớp của giảng viên X"
CREATE INDEX idx_courses_lecturer_id ON courses(lecturer_id);

-- UNIQUE(student_id, course_id) đã tạo index bắt đầu bằng student_id,
-- nhưng truy vấn "danh sách SV của lớp Y" lọc theo course_id nên cần index riêng.
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);