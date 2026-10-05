/**
 * Helper trả về response theo định dạng chuẩn của dự án:
 * { "status": "...", "message": "...", "data": {...} }
 */

const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null } = {}) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data,
    });
};

const sendError = (res, { statusCode = 500, message = 'Internal Server Error', data = null } = {}) => {
    return res.status(statusCode).json({
        status: 'error',
        message,
        data,
    });
};

module.exports = { sendSuccess, sendError };
