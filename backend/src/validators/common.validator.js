/**
 * Validator dùng chung cho nhiều module.
 */
const AppError = require('../utils/AppError');

const POSITIVE_INT_REGEX = /^[1-9]\d{0,9}$/;
const MAX_INT4 = 2147483647; // Giới hạn kiểu INTEGER/SERIAL của PostgreSQL

const isPositiveInt = (value) =>
    Number.isInteger(value) && value > 0 && value <= MAX_INT4;

/**
 * Kiểm tra các route param là số nguyên dương (vd: /courses/:id).
 * Chặn sớm các giá trị như "abc", "-1", "1.5" trước khi xuống DB
 * (nếu không PostgreSQL sẽ báo lỗi kiểu dữ liệu => thành lỗi 500).
 * @param  {...string} names - Tên các param cần kiểm tra
 */
const validateIdParams = (...names) => (req, res, next) => {
    for (const name of names) {
        const raw = req.params[name];
        if (!POSITIVE_INT_REGEX.test(raw) || Number(raw) > MAX_INT4) {
            throw new AppError(`Invalid ${name}: must be a positive integer`, 400);
        }
    }
    next();
};

module.exports = { validateIdParams, isPositiveInt };
