/**
 * Validate dữ liệu đầu vào cho module Leave Requests.
 */
const AppError = require('../utils/AppError');
const { isPositiveInt } = require('./common.validator');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const validateSubmit = (req, res, next) => {
    const rawCourseId = req.body?.course_id !== undefined ? req.body.course_id : req.body?.courseId;
    const rawDate = req.body?.requested_date !== undefined ? req.body.requested_date : req.body?.requestedDate;
    const rawSessionId = req.body?.session_id !== undefined ? req.body.session_id : req.body?.sessionId;
    const rawProof = req.body?.proof_image_url !== undefined ? req.body.proof_image_url : req.body?.proofImageUrl;
    const { reason } = req.body || {};

    if (!isPositiveInt(rawCourseId)) {
        throw new AppError('course_id must be a positive integer', 400);
    }

    if (typeof rawDate !== 'string' || !DATE_REGEX.test(rawDate.trim())) {
        throw new AppError('requested_date must be in YYYY-MM-DD format', 400);
    }

    // Kiểm tra tính hợp lệ của ngày
    const parsedDate = new Date(rawDate.trim());
    if (isNaN(parsedDate.getTime())) {
        throw new AppError('Invalid date for requested_date', 400);
    }

    if (typeof reason !== 'string' || reason.trim() === '') {
        throw new AppError('reason is required and cannot be empty', 400);
    }

    if (rawSessionId !== undefined && rawSessionId !== null && !isPositiveInt(rawSessionId)) {
        throw new AppError('session_id must be a positive integer', 400);
    }

    req.body = {
        courseId: Number(rawCourseId),
        requestedDate: rawDate.trim(),
        reason: reason.trim(),
        proofImageUrl: typeof rawProof === 'string' ? rawProof.trim() : null,
        sessionId: rawSessionId ? Number(rawSessionId) : null,
    };

    next();
};

const validateReview = (req, res, next) => {
    const rawStatus = req.body?.status;
    const rawNote = req.body?.review_note !== undefined ? req.body.review_note : req.body?.reviewNote;

    if (typeof rawStatus !== 'string') {
        throw new AppError('status is required', 400);
    }

    const normStatus = rawStatus.trim().toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(normStatus)) {
        throw new AppError('status must be either APPROVED or REJECTED', 400);
    }

    req.body = {
        status: normStatus,
        reviewNote: typeof rawNote === 'string' ? rawNote.trim() : null,
    };

    next();
};

module.exports = {
    validateSubmit,
    validateReview,
};
