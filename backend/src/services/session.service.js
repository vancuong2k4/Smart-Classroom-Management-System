const sessionModel = require('../models/session.model');
const courseService = require('./course.service');
const { withTransaction } = require('../utils/transaction');
const AppError = require('../utils/AppError');
const config = require('../config/session');

const openSession = async (user, courseId, data) => {
    // Chỉ ADMIN hoặc GV của lớp mới được mở phiên
    await courseService.getManageableCourse(user, courseId);

    const radiusMeters = data.radiusMeters ?? config.defaultRadiusMeters;
    const lateAfterMinutes = data.lateAfterMinutes ?? config.defaultLateAfterMinutes;
    const durationMinutes = data.durationMinutes ?? config.defaultDurationMinutes;
    const ipRange = data.ipRange ?? config.defaultIpRange;

    if (radiusMeters < config.minRadiusMeters || radiusMeters > config.maxRadiusMeters) {
        throw new AppError(`radius_meters must be between ${config.minRadiusMeters} and ${config.maxRadiusMeters}`, 400);
    }
    if (durationMinutes <= 0 || durationMinutes > config.maxDurationMinutes) {
        throw new AppError(`duration_minutes must be between 1 and ${config.maxDurationMinutes}`, 400);
    }
    if (!ipRange) {
        throw new AppError('ip_range is required (or set SCHOOL_IP_RANGE in .env)', 400);
    }

    // Dùng transaction để lock course, đảm bảo tính tuần tự khi xử lý đồng thời
    return withTransaction(async (db) => {
        await sessionModel.lockCourse(courseId, db);

        const active = await sessionModel.findActiveByCourse(courseId, db);
        if (active) {
            throw new AppError('An active session already exists for this course', 409);
        }

        const sessionId = await sessionModel.create({
            courseId,
            lecturerId: user.id,
            latitude: data.latitude,
            longitude: data.longitude,
            ipRange,
            radiusMeters,
            lateAfterMinutes,
            durationMinutes
        }, db);

        return sessionModel.findById(sessionId, db);
    });
};

const getSession = async (user, sessionId) => {
    const session = await sessionModel.findById(sessionId);
    if (!session) throw new AppError('Session not found', 404);

    // Kiểm tra quyền (SV phải thuộc lớp mới xem được thông tin phiên)
    await courseService.getCourse(user, session.course_id);
    return session;
};

const listByCourse = async (user, courseId) => {
    await courseService.getCourse(user, courseId);
    return sessionModel.findByCourse(courseId);
};

const closeSession = async (user, sessionId) => {
    const session = await sessionModel.findById(sessionId);
    if (!session) throw new AppError('Session not found', 404);

    // Phải có quyền quản lý
    await courseService.getManageableCourse(user, session.course_id);

    const closed = await sessionModel.close(sessionId);
    if (!closed) throw new AppError('Session is already closed or expired', 400);
};

module.exports = { openSession, getSession, listByCourse, closeSession };
