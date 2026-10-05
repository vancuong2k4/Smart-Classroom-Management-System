/**
 * Middleware xác thực (Authentication) và phân quyền (Authorization).
 *
 * Cách dùng trong route:
 *   router.get('/me', authenticate, controller.me);
 *   router.post('/sessions', authenticate, authorize('LECTURER'), controller.create);
 */
const authService = require('../services/auth.service');
const AppError = require('../utils/AppError');

/**
 * Xác thực JWT từ header: "Authorization: Bearer <token>".
 * Nếu hợp lệ, gán thông tin user vào req.user = { id, role }.
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        throw new AppError('Authentication token is missing', 401);
    }

    const payload = authService.verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
};

/**
 * Phân quyền theo vai trò (Role-Based Access Control).
 * Phải đặt SAU authenticate.
 * @param  {...string} allowedRoles - Các role được phép, vd: authorize('ADMIN', 'LECTURER')
 */
const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        throw new AppError('Authentication required', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
        throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
};

module.exports = { authenticate, authorize };
