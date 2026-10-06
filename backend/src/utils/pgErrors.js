/**
 * Mã lỗi PostgreSQL thường gặp.
 * Tham khảo: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_ERROR = Object.freeze({
    UNIQUE_VIOLATION: '23505',      // Trùng giá trị cột UNIQUE
    FOREIGN_KEY_VIOLATION: '23503', // Tham chiếu tới bản ghi không tồn tại
});

module.exports = PG_ERROR;
