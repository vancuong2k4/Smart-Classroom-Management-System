/**
 * Auth Controller - Chỉ nhận request, gọi Service và trả response.
 * KHÔNG chứa logic nghiệp vụ.
 */
const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

const register = async (req, res) => {
    const result = await authService.register(req.body);
    return sendSuccess(res, {
        statusCode: 201,
        message: 'Register successfully',
        data: result,
    });
};

const login = async (req, res) => {
    const result = await authService.login(req.body);
    return sendSuccess(res, {
        message: 'Login successfully',
        data: result,
    });
};

const getMe = async (req, res) => {
    const user = await authService.getCurrentUser(req.user.id);
    return sendSuccess(res, {
        message: 'Get current user successfully',
        data: { user },
    });
};

module.exports = { register, login, getMe };
