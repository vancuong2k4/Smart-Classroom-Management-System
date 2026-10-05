/**
 * Middleware xử lý lỗi tập trung.
 * Express 5 tự động chuyển lỗi từ async handler vào đây (không cần try/catch ở controller).
 */
const AppError = require('../utils/AppError');
const { sendError } = require('../utils/response');

// Bắt các route không tồn tại
const notFound = (req, res, next) => {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    // Body JSON sai cú pháp
    if (err.type === 'entity.parse.failed') {
        return sendError(res, { statusCode: 400, message: 'Invalid JSON body' });
    }

    // Lỗi nghiệp vụ đã dự đoán => trả message cho client
    if (err instanceof AppError) {
        return sendError(res, { statusCode: err.statusCode, message: err.message });
    }

    // Lỗi không lường trước (bug, mất kết nối DB...) => log chi tiết, ẩn chi tiết với client
    console.error('[Unhandled Error]', err);
    return sendError(res, {
        statusCode: 500,
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    });
};

module.exports = { notFound, errorHandler };
