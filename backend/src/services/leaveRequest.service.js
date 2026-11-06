/**
 * LeaveRequest Service - Nghiệp vụ Đơn xin nghỉ phép trực tuyến.
 */
const leaveRequestModel = require('../models/leaveRequest.model');
const enrollmentModel = require('../models/enrollment.model');
const courseModel = require('../models/course.model');
const courseService = require('./course.service');
const sessionModel = require('../models/session.model');
const AppError = require('../utils/AppError');
const ROLES = require('../constants/roles');

/**
 * Sinh viên gửi đơn xin nghỉ phép.
 */
const submitRequest = async (currentUser, { courseId, requestedDate, reason, proofImageUrl, sessionId }) => {
    if (currentUser.role !== ROLES.STUDENT) {
        throw new AppError('Only students can submit leave requests', 403);
    }

    const course = await courseModel.findById(courseId);
    if (!course) {
        throw new AppError('Course not found', 404);
    }

    const isEnrolled = await enrollmentModel.isEnrolled(courseId, currentUser.id);
    if (!isEnrolled) {
        throw new AppError('You are not enrolled in this course', 403);
    }

    let resolvedSessionId = sessionId || null;
    if (resolvedSessionId) {
        const session = await sessionModel.findById(resolvedSessionId);
        if (!session || session.course_id !== courseId) {
            throw new AppError('Session does not belong to this course', 400);
        }
    } else {
        // Tự động tìm buổi học trùng ngày xin nghỉ (nếu đã được tạo trước)
        const session = await leaveRequestModel.findSessionForCourseAndDate(courseId, requestedDate);
        if (session) {
            resolvedSessionId = session.id;
        }
    }

    const leaveRequest = await leaveRequestModel.create({
        studentId: currentUser.id,
        courseId,
        sessionId: resolvedSessionId,
        reason,
        proofImageUrl: proofImageUrl || null,
        requestedDate,
    });

    return leaveRequest;
};

/**
 * Lấy danh sách đơn xin nghỉ phép theo vai trò:
 * - STUDENT: chỉ xem đơn của chính mình.
 * - LECTURER: chỉ xem đơn của các lớp mình phụ trách.
 * - ADMIN: toàn quyền xem tất cả.
 */
const getLeaveRequests = async (currentUser, { courseId, status, studentId } = {}) => {
    const filters = {
        courseId: courseId ? Number(courseId) : undefined,
        status: status ? String(status).toUpperCase() : undefined,
    };

    if (currentUser.role === ROLES.STUDENT) {
        filters.studentId = currentUser.id;
    } else if (currentUser.role === ROLES.LECTURER) {
        filters.lecturerId = currentUser.id;
        if (studentId) filters.studentId = Number(studentId);
    } else if (currentUser.role === ROLES.ADMIN) {
        if (studentId) filters.studentId = Number(studentId);
    }

    return leaveRequestModel.findAll(filters);
};

/**
 * Lấy chi tiết một đơn xin nghỉ phép.
 */
const getLeaveRequestById = async (currentUser, id) => {
    const leaveRequest = await leaveRequestModel.findById(id);
    if (!leaveRequest) {
        throw new AppError('Leave request not found', 404);
    }

    if (currentUser.role === ROLES.STUDENT && leaveRequest.student_id !== currentUser.id) {
        throw new AppError('You do not have permission to view this leave request', 403);
    }

    if (currentUser.role === ROLES.LECTURER && leaveRequest.lecturer_id !== currentUser.id) {
        throw new AppError('You do not have permission to view this leave request', 403);
    }

    return leaveRequest;
};

/**
 * Giảng viên / Quản trị viên duyệt hoặc từ chối đơn xin nghỉ phép.
 * - Nếu DUYỆT (APPROVED): tự động đồng bộ trạng thái điểm danh buổi đó sang EXCUSED (Nghỉ có phép).
 * - Nếu TỪ CHỐI (REJECTED): hủy trạng thái EXCUSED (nếu trước đó đã từng duyệt).
 */
const reviewLeaveRequest = async (currentUser, id, { status, reviewNote }) => {
    const normalizedStatus = String(status).trim().toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(normalizedStatus)) {
        throw new AppError('Status must be either APPROVED or REJECTED', 400);
    }

    const leaveRequest = await leaveRequestModel.findById(id);
    if (!leaveRequest) {
        throw new AppError('Leave request not found', 404);
    }

    // Kiểm tra quyền quản lý lớp của đơn này
    await courseService.getManageableCourse(currentUser, leaveRequest.course_id);

    let targetSessionId = leaveRequest.session_id;

    if (normalizedStatus === 'APPROVED') {
        if (!targetSessionId) {
            // Tìm session trùng ngày diễn ra lớp học
            const foundSession = await leaveRequestModel.findSessionForCourseAndDate(
                leaveRequest.course_id,
                leaveRequest.requested_date
            );
            if (foundSession) {
                targetSessionId = foundSession.id;
            }
        }

        // Cập nhật đơn
        const updated = await leaveRequestModel.review(id, {
            status: normalizedStatus,
            reviewNote,
            reviewedBy: currentUser.id,
            sessionId: targetSessionId,
        });

        // Nếu xác định được buổi học, ghi nhận điểm danh EXCUSED
        if (targetSessionId) {
            await leaveRequestModel.upsertExcusedAttendance(targetSessionId, leaveRequest.student_id);
        }

        return updated;
    } else {
        // TỪ CHỐI
        const updated = await leaveRequestModel.review(id, {
            status: normalizedStatus,
            reviewNote,
            reviewedBy: currentUser.id,
        });

        if (targetSessionId) {
            await leaveRequestModel.revertExcusedAttendance(targetSessionId, leaveRequest.student_id);
        }

        return updated;
    }
};

module.exports = {
    submitRequest,
    getLeaveRequests,
    getLeaveRequestById,
    reviewLeaveRequest,
};
