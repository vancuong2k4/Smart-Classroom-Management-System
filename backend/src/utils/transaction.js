/**
 * Chạy một nhóm câu lệnh SQL trong cùng 1 transaction.
 * - Callback trả về bình thường  => COMMIT
 * - Callback ném lỗi             => ROLLBACK (rồi ném lại lỗi cho tầng trên xử lý)
 *
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
const pool = require('../config/database');

const withTransaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { withTransaction };
