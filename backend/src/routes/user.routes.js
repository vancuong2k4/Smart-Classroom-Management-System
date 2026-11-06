const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateIdParams } = require('../validators/common.validator');
const {
    validateListUsers,
    validateCreateUser,
    validateResetPassword,
    validateUpdateUser,
    validateImportCsv,
} = require('../validators/user.validator');
const ROLES = require('../constants/roles');

const router = express.Router();
const { ADMIN, LECTURER } = ROLES;

// Tất cả API người dùng đều yêu cầu đăng nhập
router.use(authenticate);

// GET  /api/users                - Danh sách người dùng (ADMIN xem tất cả, LECTURER xem LECTURER hoặc STUDENT)
router.get('/', authorize(ADMIN, LECTURER), validateListUsers, userController.list);

// POST /api/users/import-csv     - Import người dùng hàng loạt từ CSV / mảng JSON (Chỉ ADMIN)
router.post('/import-csv', authorize(ADMIN), validateImportCsv, userController.importCsv);

// GET  /api/users/:id            - Xem chi tiết thông tin người dùng
router.get('/:id', authorize(ADMIN, LECTURER), validateIdParams('id'), userController.getById);

// POST /api/users                - Tạo tài khoản mới trực tiếp (Chỉ ADMIN)
router.post('/', authorize(ADMIN), validateCreateUser, userController.create);

// PATCH /api/users/:id           - Cập nhật thông tin tài khoản (Chỉ ADMIN)
router.patch('/:id', authorize(ADMIN), validateIdParams('id'), validateUpdateUser, userController.update);

// POST /api/users/:id/reset-password - Đặt lại mật khẩu mặc định (Chỉ ADMIN)
router.post('/:id/reset-password', authorize(ADMIN), validateIdParams('id'), validateResetPassword, userController.resetPassword);

// POST /api/users/:id/unbind-device  - Hủy liên kết thiết bị Device Binding (Chỉ ADMIN)
router.post('/:id/unbind-device', authorize(ADMIN), validateIdParams('id'), userController.unbindDevice);

// PATCH /api/users/:id/toggle-lock   - Khóa hoặc mở khóa tài khoản (Chỉ ADMIN)
router.patch('/:id/toggle-lock', authorize(ADMIN), validateIdParams('id'), userController.toggleLock);

module.exports = router;
