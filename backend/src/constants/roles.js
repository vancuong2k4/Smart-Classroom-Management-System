/**
 * Các vai trò người dùng - khớp với ENUM `user_role` trong database.
 * Dùng hằng số thay vì gõ chuỗi trực tiếp để tránh lỗi chính tả.
 */
const ROLES = Object.freeze({
    ADMIN: 'ADMIN',
    LECTURER: 'LECTURER',
    STUDENT: 'STUDENT',
});

module.exports = ROLES;
