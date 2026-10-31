const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateIdParams } = require('../validators/common.validator');
const { validateListUsers, validateCreateUser } = require('../validators/user.validator');
const ROLES = require('../constants/roles');

const router = express.Router();
const { ADMIN, LECTURER } = ROLES;

// Tất cả API người dùng đều yêu cầu đăng nhập
router.use(authenticate);

// GET  /api/users       - Danh sách người dùng (ADMIN xem tất cả, LECTURER chỉ xem LECTURER hoặc STUDENT)
router.get('/', authorize(ADMIN, LECTURER), validateListUsers, userController.list);

// GET  /api/users/:id   - Xem chi tiết thông tin người dùng
router.get('/:id', authorize(ADMIN, LECTURER), validateIdParams('id'), userController.getById);

// POST /api/users       - Tạo tài khoản mới trực tiếp (Chỉ ADMIN)
router.post('/', authorize(ADMIN), validateCreateUser, userController.create);

module.exports = router;
