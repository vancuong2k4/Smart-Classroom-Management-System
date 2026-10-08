const pool = require('../config/database');

/**
 * Lấy thống kê điểm danh của toàn bộ sinh viên trong một lớp.
 * Sử dụng LEFT JOIN để liệt kê cả những sinh viên chưa từng điểm danh.
 */
const getCourseReport = async (courseId) => {
    const query = `
        WITH course_sessions AS (
            SELECT id FROM sessions WHERE course_id = $1
        ),
        session_count AS (
            SELECT COUNT(*) AS total_sessions FROM course_sessions
        ),
        student_attendance AS (
            SELECT
                a.student_id,
                COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present_count,
                COUNT(*) FILTER (WHERE a.status = 'LATE') AS late_count,
                COUNT(*) FILTER (WHERE a.status = 'INVALID_LOCATION') AS invalid_count
            FROM attendance_records a
            WHERE a.session_id IN (SELECT id FROM course_sessions)
            GROUP BY a.student_id
        )
        SELECT
            u.id AS student_id,
            u.username,
            COALESCE(sa.present_count, 0)::int AS present_count,
            COALESCE(sa.late_count, 0)::int AS late_count,
            COALESCE(sa.invalid_count, 0)::int AS invalid_count,
            COALESCE((SELECT total_sessions FROM session_count), 0)::int AS total_sessions,
            (
                COALESCE((SELECT total_sessions FROM session_count), 0) 
                - COALESCE(sa.present_count, 0) 
                - COALESCE(sa.late_count, 0)
            )::int AS absent_count
        FROM enrollments e
        JOIN users u ON u.id = e.student_id
        LEFT JOIN student_attendance sa ON sa.student_id = u.id
        WHERE e.course_id = $1
        ORDER BY u.username;
    `;
    const { rows } = await pool.query(query, [courseId]);
    return rows;
};

/**
 * Lấy lịch sử điểm danh chi tiết của một sinh viên cụ thể.
 * Có thể lọc theo courseId (nếu truyền vào) hoặc lấy tất cả các lớp.
 */
const getStudentHistory = async (studentId, courseId = null) => {
    const params = [studentId];
    let courseFilter = '';
    
    if (courseId) {
        params.push(courseId);
        courseFilter = 'AND c.id = $2';
    }

    const query = `
        SELECT
            c.id AS course_id,
            c.code AS course_code,
            c.name AS course_name,
            s.id AS session_id,
            s.start_time,
            COALESCE(a.status, 'ABSENT') AS status,
            a.scanned_ip::text AS ip_address,
            a.created_at AS checked_in_at
        FROM sessions s
        JOIN courses c ON c.id = s.course_id
        -- Chỉ lấy những lớp mà SV này có đăng ký
        JOIN enrollments e ON e.course_id = c.id AND e.student_id = $1
        -- LEFT JOIN với bảng điểm danh để xem trạng thái (nếu NULL nghĩa là vắng)
        LEFT JOIN attendance_records a ON a.session_id = s.id AND a.student_id = $1
        WHERE 1=1 ${courseFilter}
        ORDER BY s.start_time DESC;
    `;
    
    const { rows } = await pool.query(query, params);
    return rows;
};

module.exports = {
    getCourseReport,
    getStudentHistory
};
