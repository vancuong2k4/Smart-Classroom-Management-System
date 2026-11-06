/**
 * Validate dữ liệu đầu vào cho module Users.
 */
const AppError = require('../utils/AppError');
const ROLES = require('../constants/roles');

const VALID_ROLES = Object.values(ROLES);
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 72;

const validateListUsers = (req, res, next) => {
    const { role, search } = req.query;

    if (role !== undefined) {
        const normalizedRole = String(role).trim().toUpperCase();
        if (!VALID_ROLES.includes(normalizedRole)) {
            throw new AppError(`role must be one of: ${VALID_ROLES.join(', ')}`, 400);
        }
        req.query.role = normalizedRole;
    }

    if (search !== undefined) {
        if (typeof search !== 'string') {
            throw new AppError('search must be a string', 400);
        }
        req.query.search = search.trim();
    }

    next();
};

const validateCreateUser = (req, res, next) => {
    const { username, password, role, fullName, full_name, email } = req.body || {};

    if (typeof username !== 'string' || !USERNAME_REGEX.test(username.trim())) {
        throw new AppError('Username must be 3-50 characters (letters, numbers, "_" or ".")', 400);
    }
    if (typeof password !== 'string'
        || password.length < PASSWORD_MIN_LENGTH
        || password.length > PASSWORD_MAX_LENGTH) {
        throw new AppError(`Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`, 400);
    }

    const normalizedRole = role ? String(role).trim().toUpperCase() : ROLES.STUDENT;
    if (!VALID_ROLES.includes(normalizedRole)) {
        throw new AppError(`Role must be one of: ${VALID_ROLES.join(', ')}`, 400);
    }

    const name = (fullName || full_name || '').trim();
    const mail = (email || '').trim().toLowerCase();

    if (mail && !EMAIL_REGEX.test(mail)) {
        throw new AppError('Invalid email address format', 400);
    }

    req.body = {
        username: username.trim().toLowerCase(),
        password,
        role: normalizedRole,
        fullName: name || null,
        email: mail || null,
    };
    next();
};

const validateResetPassword = (req, res, next) => {
    const { newPassword, password } = req.body || {};
    const passToSet = newPassword || password;

    if (passToSet !== undefined) {
        if (typeof passToSet !== 'string'
            || passToSet.length < PASSWORD_MIN_LENGTH
            || passToSet.length > PASSWORD_MAX_LENGTH) {
            throw new AppError(`Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`, 400);
        }
        req.body = { newPassword: passToSet };
    } else {
        req.body = { newPassword: '123456' };
    }

    next();
};

const validateUpdateUser = (req, res, next) => {
    const { fullName, full_name, email, role, isLocked, is_locked, deviceId, device_id } = req.body || {};
    const sanitized = {};

    if (fullName !== undefined || full_name !== undefined) {
        sanitized.fullName = String(fullName !== undefined ? fullName : full_name).trim();
    }

    if (email !== undefined) {
        const mail = String(email).trim().toLowerCase();
        if (mail && !EMAIL_REGEX.test(mail)) {
            throw new AppError('Invalid email address format', 400);
        }
        sanitized.email = mail || null;
    }

    if (role !== undefined) {
        const normRole = String(role).trim().toUpperCase();
        if (!VALID_ROLES.includes(normRole)) {
            throw new AppError(`Role must be one of: ${VALID_ROLES.join(', ')}`, 400);
        }
        sanitized.role = normRole;
    }

    if (isLocked !== undefined || is_locked !== undefined) {
        sanitized.isLocked = Boolean(isLocked !== undefined ? isLocked : is_locked);
    }

    if (deviceId !== undefined || device_id !== undefined) {
        const dev = deviceId !== undefined ? deviceId : device_id;
        sanitized.deviceId = dev ? String(dev).trim() : null;
    }

    if (Object.keys(sanitized).length === 0) {
        throw new AppError('At least one field to update must be provided', 400);
    }

    req.body = sanitized;
    next();
};

const validateImportCsv = (req, res, next) => {
    if (!req.body || (typeof req.body !== 'object' && typeof req.body !== 'string')) {
        throw new AppError('Request body with CSV content or users array is required', 400);
    }
    next();
};

module.exports = {
    validateListUsers,
    validateCreateUser,
    validateResetPassword,
    validateUpdateUser,
    validateImportCsv,
};
