/**
 * Enrollment Model - Tầng Data Access cho bảng `enrollments` (SV <-> Lớp).
 */
const pool = require('../config/database');

const isEnrolled = async (courseId, studentId) => {
    const { rows } = await pool.query(
        'SELECT 1 FROM enrollments WHERE course_id = $1 AND student_id = $2',
        [courseId, studentId]
    );
    return rows.length > 0;
};

const findStudentsByCourse = async (courseId) => {
    const { rows } = await pool.query(
        `SELECT u.id, u.username, e.created_at AS enrolled_at
         FROM enrollments e
         JOIN users u ON u.id = e.student_id
         WHERE e.course_id = $1
         ORDER BY u.username`,
        [courseId]
    );
    return rows;
};

/**
 * Thêm nhiều SV vào lớp trong 1 câu query.
 * - unnest($2::int[]) biến mảng id thành nhiều dòng để INSERT một lần.
 * - ON CONFLICT DO NOTHING: SV đã có trong lớp thì bỏ qua (không báo lỗi),
 *   nhờ ràng buộc UNIQUE(student_id, course_id) tạo ở T002.
 * @returns {Promise<number[]>} danh sách student_id THỰC SỰ được thêm mới
 */
const bulkInsert = async (courseId, studentIds) => {
    if (studentIds.length === 0) return [];
    const { rows } = await pool.query(
        `INSERT INTO enrollments (course_id, student_id)
         SELECT $1, unnest($2::int[])
         ON CONFLICT (student_id, course_id) DO NOTHING
         RETURNING student_id`,
        [courseId, studentIds]
    );
    return rows.map((r) => r.student_id);
};

/**
 * @returns {Promise<boolean>} true nếu xóa thành công
 */
const remove = async (courseId, studentId) => {
    const { rowCount } = await pool.query(
        'DELETE FROM enrollments WHERE course_id = $1 AND student_id = $2',
        [courseId, studentId]
    );
    return rowCount > 0;
};

module.exports = {
    isEnrolled,
    findStudentsByCourse,
    bulkInsert,
    remove,
};
