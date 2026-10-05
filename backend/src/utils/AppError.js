/**
 * Lỗi nghiệp vụ có kèm HTTP status code.
 * Service ném AppError, error middleware sẽ bắt và trả về response chuẩn.
 * Nhờ vậy Service không cần biết gì về `res` của Express.
 */
class AppError extends Error {
    /**
     * @param {string} message - Thông báo lỗi trả về cho client
     * @param {number} statusCode - HTTP status code (mặc định 400)
     */
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.isOperational = true; // Lỗi dự đoán được (khác với bug hệ thống)
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
