const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../validators/auth.validator');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// POST /api/auth/register - Đăng ký (STUDENT | LECTURER)
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login - Đăng nhập, trả về JWT
router.post('/login', validateLogin, authController.login);

// GET /api/auth/me - Lấy thông tin user hiện tại (cần token)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
