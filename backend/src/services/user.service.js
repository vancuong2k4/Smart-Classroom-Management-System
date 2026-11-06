/**
 * User Service - Nghiệp vụ quản lý tài khoản người dùng.
 */
const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const authService = require('./auth.service');
const AppError = require('../utils/AppError');
const ROLES = require('../constants/roles');
const jwtConfig = require('../config/jwt');

const DEFAULT_PASSWORD = '123456';
const VALID_ROLES = Object.values(ROLES);

/**
 * Phân tích 1 dòng CSV có hỗ trợ dấu ngoặc kép ("...").
 */
function splitCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

/**
 * Phân tích chuỗi CSV thành mảng object theo header.
 */
function parseCsvContent(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return [];

    const headers = splitCsvLine(lines[0]).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = splitCsvLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] !== undefined ? values[idx].trim().replace(/^["']|["']$/g, '') : '';
        });
        rows.push({ lineNumber: i + 1, data: row });
    }
    return rows;
}

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
const createUser = async (currentUser, { username, password, role, fullName, email }) => {
    if (currentUser.role !== ROLES.ADMIN) {
        throw new AppError('Only ADMIN can create accounts via this endpoint', 403);
    }
    return authService.createAccount({ username, password, role, fullName, email });
};

/**
 * Reset mật khẩu của user về mật khẩu mới (mặc định 123456). Chỉ ADMIN.
 */
const resetPassword = async (currentUser, targetUserId, newPassword = DEFAULT_PASSWORD) => {
    if (currentUser.role !== ROLES.ADMIN) {
        throw new AppError('Only ADMIN can reset passwords', 403);
    }

    const targetUser = await userModel.findById(targetUserId);
    if (!targetUser) {
        throw new AppError('User not found', 404);
    }

    const passwordHash = await bcrypt.hash(newPassword, jwtConfig.saltRounds);
    const updated = await userModel.resetPassword(targetUserId, passwordHash);
    return {
        user: updated,
        defaultPassword: newPassword,
    };
};

/**
 * Hủy liên kết thiết bị (Device Unbinding). Chỉ ADMIN.
 */
const unbindDevice = async (currentUser, targetUserId) => {
    if (currentUser.role !== ROLES.ADMIN) {
        throw new AppError('Only ADMIN can unbind devices', 403);
    }

    const targetUser = await userModel.findById(targetUserId);
    if (!targetUser) {
        throw new AppError('User not found', 404);
    }

    const updated = await userModel.unbindDevice(targetUserId);
    return updated;
};

/**
 * Khóa hoặc mở khóa tài khoản. Chỉ ADMIN.
 */
const toggleLock = async (currentUser, targetUserId, isLocked) => {
    if (currentUser.role !== ROLES.ADMIN) {
        throw new AppError('Only ADMIN can lock or unlock accounts', 403);
    }

    if (currentUser.id === targetUserId) {
        throw new AppError('You cannot lock your own admin account', 400);
    }

    const targetUser = await userModel.findById(targetUserId);
    if (!targetUser) {
        throw new AppError('User not found', 404);
    }

    const updated = await userModel.setLockStatus(targetUserId, Boolean(isLocked));
    return updated;
};

/**
 * Cập nhật thông tin tài khoản (full_name, email, role, is_locked). Chỉ ADMIN.
 */
const updateUser = async (currentUser, targetUserId, fields) => {
    if (currentUser.role !== ROLES.ADMIN) {
        throw new AppError('Only ADMIN can update account details', 403);
    }

    const targetUser = await userModel.findById(targetUserId);
    if (!targetUser) {
        throw new AppError('User not found', 404);
    }

    const updated = await userModel.update(targetUserId, fields);
    return updated;
};

/**
 * Import danh sách người dùng hàng loạt từ CSV hoặc mảng JSON. Chỉ ADMIN.
 */
const importUsersCsv = async (currentUser, payload) => {
    if (currentUser.role !== ROLES.ADMIN) {
        throw new AppError('Only ADMIN can import accounts', 403);
    }

    let itemsToProcess = [];

    if (Array.isArray(payload.users)) {
        itemsToProcess = payload.users.map((u, idx) => ({ lineNumber: idx + 1, data: u }));
    } else {
        const rawCsv = typeof payload === 'string' ? payload : (payload.csvContent || payload.csv || '');
        if (!rawCsv || typeof rawCsv !== 'string' || rawCsv.trim() === '') {
            throw new AppError('CSV content or users array is required', 400);
        }
        itemsToProcess = parseCsvContent(rawCsv);
    }

    if (itemsToProcess.length === 0) {
        throw new AppError('No valid data rows found to import', 400);
    }

    const createdUsers = [];
    const errors = [];

    for (const item of itemsToProcess) {
        const d = item.data;
        const username = (d.username || d.mssv || d.ma_sv || d.user || '').trim().toLowerCase();
        const fullName = (d.full_name || d.fullname || d.ho_ten || d.hoten || d.name || '').trim() || null;
        const email = (d.email || d.mail || '').trim().toLowerCase() || null;
        const rawRole = (d.role || d.vai_tro || d.vaitro || ROLES.STUDENT).trim().toUpperCase();
        const role = VALID_ROLES.includes(rawRole) ? rawRole : ROLES.STUDENT;
        const password = (d.password || d.mat_khau || d.matkhau || DEFAULT_PASSWORD).trim();

        if (!username || username.length < 3) {
            errors.push({
                row: item.lineNumber,
                username: username || '(empty)',
                error: 'Username must be at least 3 characters',
            });
            continue;
        }

        try {
            const user = await authService.createAccount({
                username,
                password,
                role,
                fullName,
                email,
            });
            createdUsers.push(user);
        } catch (err) {
            errors.push({
                row: item.lineNumber,
                username,
                error: err.message,
            });
        }
    }

    return {
        total: itemsToProcess.length,
        importedCount: createdUsers.length,
        failedCount: errors.length,
        errors,
        createdUsers,
    };
};

module.exports = {
    listUsers,
    getUserById,
    createUser,
    resetPassword,
    unbindDevice,
    toggleLock,
    updateUser,
    importUsersCsv,
};
