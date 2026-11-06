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

const resetPassword = async (req, res) => {
    const result = await userService.resetPassword(req.user, Number(req.params.id), req.body.newPassword);
    return sendSuccess(res, {
        message: 'Reset password successfully',
        data: result,
    });
};

const unbindDevice = async (req, res) => {
    const user = await userService.unbindDevice(req.user, Number(req.params.id));
    return sendSuccess(res, {
        message: 'Hủy liên kết thiết bị thành công',
        data: { user },
    });
};

const toggleLock = async (req, res) => {
    const user = await userService.toggleLock(req.user, Number(req.params.id), req.body.isLocked);
    return sendSuccess(res, {
        message: 'Cập nhật trạng thái khóa tài khoản thành công',
        data: { user },
    });
};

const update = async (req, res) => {
    const user = await userService.updateUser(req.user, Number(req.params.id), req.body);
    return sendSuccess(res, {
        message: 'Cập nhật thông tin tài khoản thành công',
        data: { user },
    });
};

const importCsv = async (req, res) => {
    const result = await userService.importUsersCsv(req.user, req.body);
    return sendSuccess(res, {
        statusCode: 200,
        message: `Import hoàn tất: ${result.importedCount}/${result.total} tài khoản thành công`,
        data: result,
    });
};

module.exports = {
    list,
    getById,
    create,
    resetPassword,
    unbindDevice,
    toggleLock,
    update,
    importCsv,
};
