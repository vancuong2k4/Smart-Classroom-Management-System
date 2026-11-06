/**
 * LeaveRequest Model - Tầng Data Access cho bảng `leave_requests`.
 */
const pool = require('../config/database');

const BASE_SELECT = `
    SELECT lr.id,
           lr.student_id,
           lr.course_id,
           lr.session_id,
           lr.reason,
           lr.proof_image_url,
           lr.status,
           lr.review_note,
           lr.requested_date,
           lr.created_at,
           lr.reviewed_at,
           lr.reviewed_by,
           u.username AS student_username,
           u.full_name AS student_full_name,
           u.email AS student_email,
           c.code AS course_code,
           c.name AS course_name,
           c.lecturer_id,
           ru.username AS reviewer_username
    FROM leave_requests lr
    JOIN users u ON u.id = lr.student_id
    JOIN courses c ON c.id = lr.course_id
    LEFT JOIN users ru ON ru.id = lr.reviewed_by
`;

const create = async ({ studentId, courseId, sessionId = null, reason, proofImageUrl = null, requestedDate }) => {
    const { rows } = await pool.query(
        `INSERT INTO leave_requests (student_id, course_id, session_id, reason, proof_image_url, requested_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [studentId, courseId, sessionId, reason, proofImageUrl, requestedDate]
    );
    return rows[0];
};

const findById = async (id) => {
    const { rows } = await pool.query(`${BASE_SELECT} WHERE lr.id = $1`, [id]);
    return rows[0] || null;
};

const findAll = async ({ courseId, status, studentId, lecturerId } = {}) => {
    const conditions = [];
    const values = [];

    if (courseId) {
        values.push(courseId);
        conditions.push(`lr.course_id = $${values.length}`);
    }

    if (status) {
        values.push(status);
        conditions.push(`lr.status = $${values.length}`);
    }

    if (studentId) {
        values.push(studentId);
        conditions.push(`lr.student_id = $${values.length}`);
    }

    if (lecturerId) {
        values.push(lecturerId);
        conditions.push(`c.lecturer_id = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
        `${BASE_SELECT} ${whereClause} ORDER BY lr.created_at DESC`,
        values
    );
    return rows;
};

const review = async (id, { status, reviewNote = null, reviewedBy, sessionId = null }) => {
    const { rows } = await pool.query(
        `UPDATE leave_requests
         SET status = $1,
             review_note = $2,
             reviewed_by = $3,
             reviewed_at = NOW(),
             session_id = COALESCE($4, session_id)
         WHERE id = $5
         RETURNING *`,
        [status, reviewNote, reviewedBy, sessionId, id]
    );
    return rows[0] || null;
};

const findSessionForCourseAndDate = async (courseId, requestedDate) => {
    const { rows } = await pool.query(
        `SELECT id, start_time, end_time
         FROM sessions
         WHERE course_id = $1 
           AND DATE(start_time AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2::date
         ORDER BY start_time ASC
         LIMIT 1`,
        [courseId, requestedDate]
    );
    return rows[0] || null;
};

const upsertExcusedAttendance = async (sessionId, studentId) => {
    const { rows } = await pool.query(
        `INSERT INTO attendance_records (session_id, student_id, status)
         VALUES ($1, $2, 'EXCUSED')
         ON CONFLICT (session_id, student_id)
         DO UPDATE SET status = 'EXCUSED'
         RETURNING *`,
        [sessionId, studentId]
    );
    return rows[0];
};

const revertExcusedAttendance = async (sessionId, studentId) => {
    const { rows } = await pool.query(
        `DELETE FROM attendance_records
         WHERE session_id = $1 AND student_id = $2 AND status = 'EXCUSED'
         RETURNING *`,
        [sessionId, studentId]
    );
    return rows[0] || null;
};

module.exports = {
    create,
    findById,
    findAll,
    review,
    findSessionForCourseAndDate,
    upsertExcusedAttendance,
    revertExcusedAttendance,
};
