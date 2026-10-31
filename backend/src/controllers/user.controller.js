/**
 * User Controller - Nhận request, gọi Service và trả response theo chuẩn.
 */
const userService = require('../services/user.service');
const { sendSuccess } = require('../utils/response');

const list = async (req, res) => {
    const { role, search } = req.query;
    const users = await userService.listUsers(req.user, { role, search });
    return sendSuccess(res, {
        message: 'Get users successfully',
        data: { users },
    });
};

const getById = async (req, res) => {
    const user = await userService.getUserById(req.user, Number(req.params.id));
    return sendSuccess(res, {
        message: 'Get user successfully',
        data: { user },
    });
};

const create = async (req, res) => {
    const user = await userService.createUser(req.user, req.body);
    return sendSuccess(res, {
        statusCode: 201,
        message: 'User created successfully',
        data: { user },
    });
};

module.exports = {
    list,
    getById,
    create,
};
