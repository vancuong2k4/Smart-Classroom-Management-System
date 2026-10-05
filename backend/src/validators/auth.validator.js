/**
 * Validate dữ liệu đầu vào cho module Auth.
 * Trả về middleware: dữ liệu hợp lệ sẽ được chuẩn hóa và gán lại vào req.body.
 */
const AppError = require('../utils/AppError');

// Chỉ cho phép tự đăng ký với vai trò STUDENT hoặc LECTURER.
// Tài khoản ADMIN KHÔNG được tạo qua API công khai (tránh leo thang đặc quyền).
const SELF_REGISTER_ROLES = ['STUDENT', 'LECTURER'];

const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,50}$/;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 72; // bcrypt chỉ xử lý tối đa 72 byte, phần dư bị bỏ qua

const validateRegister = (req, res, next) => {
    const { username, password, role } = req.body || {};

    if (typeof username !== 'string' || !USERNAME_REGEX.test(username.trim())) {
        throw new AppError('Username must be 3-50 characters (letters, numbers, "_" or ".")', 400);
    }
    if (typeof password !== 'string'
        || password.length < PASSWORD_MIN_LENGTH
        || password.length > PASSWORD_MAX_LENGTH) {
        throw new AppError(`Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`, 400);
    }

    const normalizedRole = role === undefined ? 'STUDENT' : String(role).toUpperCase();
    if (!SELF_REGISTER_ROLES.includes(normalizedRole)) {
        throw new AppError(`Role must be one of: ${SELF_REGISTER_ROLES.join(', ')}`, 400);
    }

    req.body = {
        username: username.trim().toLowerCase(),
        password,
        role: normalizedRole,
    };
    next();
};

const validateLogin = (req, res, next) => {
    const { username, password } = req.body || {};

    if (typeof username !== 'string' || !username.trim()
        || typeof password !== 'string' || !password) {
        throw new AppError('Username and password are required', 400);
    }

    req.body = {
        username: username.trim().toLowerCase(),
        password,
    };
    next();
};

module.exports = { validateRegister, validateLogin };
