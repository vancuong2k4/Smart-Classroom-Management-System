/**
 * Course Service - Nghiệp vụ quản lý lớp học.
 *
 * Quy tắc phân quyền (ngoài việc check role ở route):
 *  - ADMIN    : toàn quyền mọi lớp, được phân công/đổi giảng viên, được xóa lớp.
 *  - LECTURER : chỉ xem/sửa lớp MÌNH phụ trách; lớp tự tạo sẽ tự gán cho mình.
 *  - STUDENT  : chỉ xem các lớp mình ĐÃ ĐĂNG KÝ.
 */
const courseModel = require('../models/course.model');
const enrollmentModel = require('../models/enrollment.model');
const userModel = require('../models/user.model');
const AppError = require('../utils/AppError');
const PG_ERROR = require('../utils/pgErrors');
const ROLES = require('../constants/roles');

const isOwner = (course, user) => course.lecturer_id === user.id;

/**
 * Đảm bảo lecturerId trỏ tới một tài khoản có role LECTURER.
 * (DB chỉ kiểm tra được "user tồn tại" qua khóa ngoại, không kiểm tra được role.)
 */
const assertIsLecturer = async (lecturerId) => {
    const lecturer = await userModel.findById(lecturerId);
    if (!lecturer || lecturer.role !== ROLES.LECTURER) {
        throw new AppError('lecturer_id must refer to an existing LECTURER account', 400);
    }
};

/**
 * Chuyển lỗi trùng mã lớp từ DB thành lỗi nghiệp vụ 409.
 */
const handleDuplicateCode = (err) => {
    if (err.code === PG_ERROR.UNIQUE_VIOLATION) {
        throw new AppError('Course code already exists', 409);
    }
    throw err;
};

/**
 * Lấy lớp và kiểm tra user có quyền QUẢN LÝ (sửa, quản lý SV) hay không.
 * Được dùng lại bởi enrollment.service.
 */
const getManageableCourse = async (user, courseId) => {
    const course = await courseModel.findById(courseId);
    if (!course) {
        throw new AppError('Course not found', 404);
    }
    if (user.role === ROLES.ADMIN) return course;
    if (user.role === ROLES.LECTURER && isOwner(course, user)) return course;

    throw new AppError('You do not have permission to manage this course', 403);
};

const createCourse = async (user, { code, name, lecturerId }) => {
    let assignedLecturerId = lecturerId ?? null;

    if (user.role === ROLES.LECTURER) {
        // Giảng viên tạo lớp => lớp thuộc về chính họ. Không cho tạo lớp "hộ" người khác.
        if (lecturerId != null && lecturerId !== user.id) {
            throw new AppError('Lecturers can only create courses for themselves', 403);
        }
        assignedLecturerId = user.id;
    } else if (assignedLecturerId !== null) {
        await assertIsLecturer(assignedLecturerId);
    }

    let courseId;
    try {
        courseId = await courseModel.create({ code, name, lecturerId: assignedLecturerId });
    } catch (err) {
        handleDuplicateCode(err);
    }
    return courseModel.findById(courseId);
};

const listCourses = async (user) => {
    switch (user.role) {
        case ROLES.ADMIN:
            return courseModel.findAll();
        case ROLES.LECTURER:
            return courseModel.findByLecturer(user.id);
        case ROLES.STUDENT:
            return courseModel.findByStudent(user.id);
        default:
            throw new AppError('You do not have permission to perform this action', 403);
    }
};

const getCourse = async (user, courseId) => {
    const course = await courseModel.findById(courseId);
    if (!course) {
        throw new AppError('Course not found', 404);
    }

    const canView =
        user.role === ROLES.ADMIN
        || (user.role === ROLES.LECTURER && isOwner(course, user))
        || (user.role === ROLES.STUDENT && await enrollmentModel.isEnrolled(courseId, user.id));

    if (!canView) {
        throw new AppError('You do not have permission to view this course', 403);
    }
    return course;
};

const updateCourse = async (user, courseId, { code, name, lecturerId }) => {
    await getManageableCourse(user, courseId);

    if (lecturerId !== undefined) {
        // Chỉ ADMIN được phân công lại giảng viên (tránh GV tự "đẩy" lớp cho người khác).
        if (user.role !== ROLES.ADMIN) {
            throw new AppError('Only ADMIN can reassign the lecturer of a course', 403);
        }
        if (lecturerId !== null) {
            await assertIsLecturer(lecturerId);
        }
    }

    try {
        await courseModel.update(courseId, { code, name, lecturerId });
    } catch (err) {
        handleDuplicateCode(err);
    }
    return courseModel.findById(courseId);
};

/**
 * Xóa lớp. CẢNH BÁO: ON DELETE CASCADE sẽ xóa luôn enrollments, sessions và
 * toàn bộ lịch sử điểm danh của lớp => route chỉ cho phép ADMIN.
 */
const deleteCourse = async (courseId) => {
    const deleted = await courseModel.remove(courseId);
    if (!deleted) {
        throw new AppError('Course not found', 404);
    }
};

module.exports = {
    getManageableCourse,
    createCourse,
    listCourses,
    getCourse,
    updateCourse,
    deleteCourse,
};
