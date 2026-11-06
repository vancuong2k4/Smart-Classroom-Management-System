/**
 * User Model - Tầng Data Access.
 * Chỉ chứa câu truy vấn SQL, KHÔNG chứa logic nghiệp vụ.
 * Luôn dùng parameterized query ($1, $2...) để chống SQL Injection.
 */
const pool = require('../config/database');

// Các cột an toàn để trả ra ngoài (không bao gồm password_hash)
const PUBLIC_COLUMNS = 'id, username, full_name, email, role, device_id, is_locked, created_at';

const UPDATABLE_COLUMNS = {
    fullName: 'full_name',
    full_name: 'full_name',
    email: 'email',
    role: 'role',
    deviceId: 'device_id',
    device_id: 'device_id',
    isLocked: 'is_locked',
    is_locked: 'is_locked',
    passwordHash: 'password_hash',
};

/**
 * Tìm user theo username, CÓ kèm password_hash và trạng thái khóa (chỉ dùng cho việc đăng nhập).
 */
const findByUsernameWithPassword = async (username) => {
    const { rows } = await pool.query(
        `SELECT id, username, password_hash, full_name, email, role, device_id, is_locked, created_at
         FROM users
         WHERE username = $1`,
        [username]
    );
    return rows[0] || null;
};

const findByUsername = async (username) => {
    const { rows } = await pool.query(
        `SELECT ${PUBLIC_COLUMNS} FROM users WHERE username = $1`,
        [username]
    );
    return rows[0] || null;
};

const findById = async (id) => {
    const { rows } = await pool.query(
        `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
        [id]
    );
    return rows[0] || null;
};

/**
 * Tìm nhiều user cùng lúc theo danh sách username (1 câu query thay vì N câu).
 */
const findByUsernames = async (usernames) => {
    const { rows } = await pool.query(
        `SELECT ${PUBLIC_COLUMNS} FROM users WHERE username = ANY($1::varchar[])`,
        [usernames]
    );
    return rows;
};

const create = async ({ username, passwordHash, role, fullName = null, email = null, deviceId = null, isLocked = false }) => {
    const { rows } = await pool.query(
        `INSERT INTO users (username, password_hash, role, full_name, email, device_id, is_locked)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${PUBLIC_COLUMNS}`,
        [username, passwordHash, role, fullName, email, deviceId, isLocked]
    );
    return rows[0];
};

/**
 * Cập nhật thông tin user theo ID.
 */
const update = async (id, fields) => {
    const setClauses = [];
    const values = [];
    const handledColumns = new Set();

    for (const [field, column] of Object.entries(UPDATABLE_COLUMNS)) {
        if (fields[field] !== undefined && !handledColumns.has(column)) {
            handledColumns.add(column);
            values.push(fields[field]);
            setClauses.push(`${column} = $${values.length}`);
        }
    }
    if (setClauses.length === 0) return null;

    values.push(id);
    const { rows } = await pool.query(
        `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING ${PUBLIC_COLUMNS}`,
        values
    );
    return rows[0] || null;
};

/**
 * Đặt lại mật khẩu cho user.
 */
const resetPassword = async (id, passwordHash) => {
    const { rows } = await pool.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING ${PUBLIC_COLUMNS}`,
        [passwordHash, id]
    );
    return rows[0] || null;
};

/**
 * Hủy liên kết thiết bị (gỡ Device Binding).
 */
const unbindDevice = async (id) => {
    const { rows } = await pool.query(
        `UPDATE users SET device_id = NULL WHERE id = $1 RETURNING ${PUBLIC_COLUMNS}`,
        [id]
    );
    return rows[0] || null;
};

/**
 * Khóa hoặc mở khóa tài khoản.
 */
const setLockStatus = async (id, isLocked) => {
    const { rows } = await pool.query(
        `UPDATE users SET is_locked = $1 WHERE id = $2 RETURNING ${PUBLIC_COLUMNS}`,
        [isLocked, id]
    );
    return rows[0] || null;
};

/**
 * Lấy danh sách users (có hỗ trợ lọc theo role và tìm kiếm theo username / full_name / email).
 */
const findAll = async ({ role, search } = {}) => {
    const conditions = [];
    const values = [];

    if (role) {
        values.push(role);
        conditions.push(`role = $${values.length}`);
    }

    if (search) {
        values.push(`%${search.trim().toLowerCase()}%`);
        conditions.push(`(
            LOWER(username) LIKE $${values.length} OR 
            LOWER(COALESCE(full_name, '')) LIKE $${values.length} OR 
            LOWER(COALESCE(email, '')) LIKE $${values.length}
        )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
        `SELECT ${PUBLIC_COLUMNS} FROM users ${whereClause} ORDER BY role ASC, username ASC`,
        values
    );
    return rows;
};

module.exports = {
    PUBLIC_COLUMNS,
    findByUsernameWithPassword,
    findByUsername,
    findById,
    findByUsernames,
    create,
    update,
    resetPassword,
    unbindDevice,
    setLockStatus,
    findAll,
};
