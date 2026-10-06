/**
 * Enrollment Service - Nghiệp vụ quản lý sinh viên trong lớp.
 * Quyền: ADMIN hoặc giảng viên phụ trách lớp (kiểm tra qua courseService.getManageableCourse).
 */
const enrollmentModel = require('../models/enrollment.model');
const userModel = require('../models/user.model');
const courseService = require('./course.service');
const AppError = require('../utils/AppError');
const ROLES = require('../constants/roles');

const listStudents = async (user, courseId) => {
    await courseService.getManageableCourse(user, courseId);
    return enrollmentModel.findStudentsByCourse(courseId);
};

/**
 * Thêm nhiều SV vào lớp theo danh sách username (thường là MSSV).
 *
 * Thiết kế "thành công một phần" (partial success): không vì 1 username sai
 * mà hủy cả danh sách 50 SV. Thay vào đó trả về báo cáo chi tiết để GV biết
 * dòng nào cần sửa:
 *  - added            : thêm mới thành công
 *  - already_enrolled : đã có trong lớp từ trước
 *  - not_found        : username không tồn tại
 *  - not_student      : tài khoản tồn tại nhưng không phải STUDENT
 */
const addStudents = async (user, courseId, usernames) => {
    await courseService.getManageableCourse(user, courseId);

    const uniqueUsernames = [...new Set(usernames)];
    const users = await userModel.findByUsernames(uniqueUsernames);
    const userByUsername = new Map(users.map((u) => [u.username, u]));

    const notFound = [];
    const notStudent = [];
    const candidates = [];

    for (const username of uniqueUsernames) {
        const found = userByUsername.get(username);
        if (!found) notFound.push(username);
        else if (found.role !== ROLES.STUDENT) notStudent.push(username);
        else candidates.push(found);
    }

    const insertedIds = new Set(
        await enrollmentModel.bulkInsert(courseId, candidates.map((s) => s.id))
    );

    return {
        added: candidates
            .filter((s) => insertedIds.has(s.id))
            .map(({ id, username }) => ({ id, username })),
        already_enrolled: candidates
            .filter((s) => !insertedIds.has(s.id))
            .map((s) => s.username),
        not_found: notFound,
        not_student: notStudent,
    };
};

const removeStudent = async (user, courseId, studentId) => {
    await courseService.getManageableCourse(user, courseId);

    const removed = await enrollmentModel.remove(courseId, studentId);
    if (!removed) {
        throw new AppError('Student is not enrolled in this course', 404);
    }
};

module.exports = {
    listStudents,
    addStudents,
    removeStudent,
};
