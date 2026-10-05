/**
 * User Model - Tầng Data Access.
 * Chỉ chứa câu truy vấn SQL, KHÔNG chứa logic nghiệp vụ.
 * Luôn dùng parameterized query ($1, $2...) để chống SQL Injection.
 */
const pool = require('../config/database');

// Các cột an toàn để trả ra ngoài (không bao gồm password_hash)
const PUBLIC_COLUMNS = 'id, username, role, created_at';

/**
 * Tìm user theo username, CÓ kèm password_hash (chỉ dùng cho việc đăng nhập).
 */
const findByUsernameWithPassword = async (username) => {
    const { rows } = await pool.query(
        `SELECT id, username, password_hash, role, created_at
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

const create = async ({ username, passwordHash, role }) => {
    const { rows } = await pool.query(
        `INSERT INTO users (username, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING ${PUBLIC_COLUMNS}`,
        [username, passwordHash, role]
    );
    return rows[0];
};

module.exports = {
    findByUsernameWithPassword,
    findByUsername,
    findById,
    create,
};
