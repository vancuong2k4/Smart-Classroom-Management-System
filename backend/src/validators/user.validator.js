/**
 * Validate dữ liệu đầu vào cho module Users.
 */
const AppError = require('../utils/AppError');
const ROLES = require('../constants/roles');

const VALID_ROLES = Object.values(ROLES);
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,50}$/;
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
    const { username, password, role } = req.body || {};

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

    req.body = {
        username: username.trim().toLowerCase(),
        password,
        role: normalizedRole,
    };
    next();
};

module.exports = {
    validateListUsers,
    validateCreateUser,
};
