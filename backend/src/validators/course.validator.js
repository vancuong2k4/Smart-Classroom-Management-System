/**
 * Validate dữ liệu đầu vào cho module Courses & Enrollments.
 * Dữ liệu hợp lệ được chuẩn hóa và gán lại vào req.body (dạng camelCase cho tầng Service).
 */
const AppError = require('../utils/AppError');
const { isPositiveInt } = require('./common.validator');

const COURSE_CODE_REGEX = /^[A-Z0-9_.-]{2,50}$/;
const COURSE_NAME_MAX = 255;
const MAX_USERNAMES_PER_REQUEST = 200;

const parseCode = (code) => {
    if (typeof code !== 'string' || !COURSE_CODE_REGEX.test(code.trim().toUpperCase())) {
        throw new AppError('code must be 2-50 characters (letters, numbers, "_", "." or "-")', 400);
    }
    return code.trim().toUpperCase();
};

const parseName = (name) => {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > COURSE_NAME_MAX) {
        throw new AppError(`name is required and must be at most ${COURSE_NAME_MAX} characters`, 400);
    }
    return name.trim();
};

/**
 * lecturer_id: số nguyên dương, hoặc null (= bỏ phân công).
 */
const parseLecturerId = (lecturerId) => {
    if (lecturerId === null) return null;
    if (!isPositiveInt(lecturerId)) {
        throw new AppError('lecturer_id must be a positive integer or null', 400);
    }
    return lecturerId;
};

const validateCreateCourse = (req, res, next) => {
    const { code, name, lecturer_id: lecturerId } = req.body || {};

    req.body = {
        code: parseCode(code),
        name: parseName(name),
        lecturerId: lecturerId === undefined ? undefined : parseLecturerId(lecturerId),
    };
    next();
};

const validateUpdateCourse = (req, res, next) => {
    const { code, name, lecturer_id: lecturerId } = req.body || {};

    if (code === undefined && name === undefined && lecturerId === undefined) {
        throw new AppError('At least one of code, name, lecturer_id is required', 400);
    }

    req.body = {
        code: code === undefined ? undefined : parseCode(code),
        name: name === undefined ? undefined : parseName(name),
        lecturerId: lecturerId === undefined ? undefined : parseLecturerId(lecturerId),
    };
    next();
};

/**
 * Body: { "usernames": ["sv001", "sv002", ...] }
 * Username được chuẩn hóa (trim + lowercase) giống lúc đăng ký ở T003.
 */
const validateAddStudents = (req, res, next) => {
    const { usernames } = req.body || {};

    if (!Array.isArray(usernames) || usernames.length === 0
        || usernames.length > MAX_USERNAMES_PER_REQUEST) {
        throw new AppError(`usernames must be a non-empty array (max ${MAX_USERNAMES_PER_REQUEST} items)`, 400);
    }
    if (!usernames.every((u) => typeof u === 'string' && u.trim())) {
        throw new AppError('Each username must be a non-empty string', 400);
    }

    req.body = {
        usernames: usernames.map((u) => u.trim().toLowerCase()),
    };
    next();
};

module.exports = {
    validateCreateCourse,
    validateUpdateCourse,
    validateAddStudents,
};
