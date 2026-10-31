/**
 * User Service - Nghiệp vụ quản lý tài khoản người dùng.
 */
const userModel = require('../models/user.model');
const authService = require('./auth.service');
const AppError = require('../utils/AppError');
const ROLES = require('../constants/roles');

/**
 * Lấy danh sách tài khoản theo phân quyền:
 * - ADMIN: toàn quyền xem tất cả tài khoản, lọc theo bất kỳ role nào.
 * - LECTURER: chỉ được xem danh sách LECTURER (đồng nghiệp) hoặc STUDENT (để tìm kiếm thêm vào lớp).
 */
const listUsers = async (currentUser, { role, search } = {}) => {
    let normalizedRole = role ? String(role).toUpperCase() : undefined;

    if (currentUser.role === ROLES.LECTURER) {
        if (!normalizedRole || (normalizedRole !== ROLES.LECTURER && normalizedRole !== ROLES.STUDENT)) {
            throw new AppError('Lecturers can only query LECTURER or STUDENT accounts', 403);
        }
    }

    return userModel.findAll({ role: normalizedRole, search });
};

/**
 * Lấy chi tiết tài khoản theo ID.
 */
const getUserById = async (currentUser, id) => {
    const user = await userModel.findById(id);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (currentUser.role === ROLES.LECTURER && user.role === ROLES.ADMIN) {
        throw new AppError('You do not have permission to view this account', 403);
    }

    return user;
};

/**
 * Tạo tài khoản mới trực tiếp bởi ADMIN (có thể tạo ADMIN, LECTURER, STUDENT).
 */
const createUser = async (currentUser, { username, password, role }) => {
    if (currentUser.role !== ROLES.ADMIN) {
        throw new AppError('Only ADMIN can create accounts via this endpoint', 403);
    }
    return authService.createAccount({ username, password, role });
};

module.exports = {
    listUsers,
    getUserById,
    createUser,
};
