/**
 * Course Model - Tầng Data Access cho bảng `courses`.
 */
const pool = require('../config/database');

/**
 * Câu SELECT gốc: kèm username giảng viên và sĩ số lớp
 * để Frontend hiển thị luôn mà không phải gọi thêm API.
 */
const BASE_SELECT = `
    SELECT c.id,
           c.code,
           c.name,
           c.lecturer_id,
           u.username AS lecturer_username,
           (SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = c.id) AS student_count,
           c.created_at
    FROM courses c
    LEFT JOIN users u ON u.id = c.lecturer_id
`;

/**
 * Ánh xạ field (camelCase ở tầng Service) -> tên cột DB.
 * Chỉ các cột trong whitelist này mới được phép UPDATE => an toàn khi ghép chuỗi SQL động.
 */
const UPDATABLE_COLUMNS = {
    code: 'code',
    name: 'name',
    lecturerId: 'lecturer_id',
};

const findById = async (id) => {
    const { rows } = await pool.query(`${BASE_SELECT} WHERE c.id = $1`, [id]);
    return rows[0] || null;
};

const findAll = async () => {
    const { rows } = await pool.query(`${BASE_SELECT} ORDER BY c.created_at DESC`);
    return rows;
};

const findByLecturer = async (lecturerId) => {
    const { rows } = await pool.query(
        `${BASE_SELECT} WHERE c.lecturer_id = $1 ORDER BY c.created_at DESC`,
        [lecturerId]
    );
    return rows;
};

const findByStudent = async (studentId) => {
    const { rows } = await pool.query(
        `${BASE_SELECT}
         WHERE EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.student_id = $1)
         ORDER BY c.created_at DESC`,
        [studentId]
    );
    return rows;
};

/**
 * @returns {Promise<number>} id của lớp vừa tạo
 */
const create = async ({ code, name, lecturerId }) => {
    const { rows } = await pool.query(
        `INSERT INTO courses (code, name, lecturer_id)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [code, name, lecturerId]
    );
    return rows[0].id;
};

/**
 * Cập nhật một phần (PATCH): chỉ các field có giá trị !== undefined mới được cập nhật.
 * @returns {Promise<boolean>} true nếu có bản ghi được cập nhật
 */
const update = async (id, fields) => {
    const setClauses = [];
    const values = [];

    for (const [field, column] of Object.entries(UPDATABLE_COLUMNS)) {
        if (fields[field] !== undefined) {
            values.push(fields[field]);
            setClauses.push(`${column} = $${values.length}`);
        }
    }
    if (setClauses.length === 0) return false;

    values.push(id);
    const { rowCount } = await pool.query(
        `UPDATE courses SET ${setClauses.join(', ')} WHERE id = $${values.length}`,
        values
    );
    return rowCount > 0;
};

/**
 * @returns {Promise<boolean>} true nếu xóa thành công
 */
const remove = async (id) => {
    const { rowCount } = await pool.query('DELETE FROM courses WHERE id = $1', [id]);
    return rowCount > 0;
};

module.exports = {
    findById,
    findAll,
    findByLecturer,
    findByStudent,
    create,
    update,
    remove,
};
