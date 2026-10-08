const express = require('express');
const sessionController = require('../controllers/session.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateIdParams } = require('../validators/common.validator');
const ROLES = require('../constants/roles');

const router = express.Router();
router.use(authenticate);

// GET    /api/sessions/:sessionId       - Xem chi tiết phiên
router.get('/:sessionId', validateIdParams('sessionId'), sessionController.getById);

// POST   /api/sessions/:sessionId/close - Đóng sớm phiên điểm danh
router.post('/:sessionId/close', authorize(ROLES.ADMIN, ROLES.LECTURER), validateIdParams('sessionId'), sessionController.close);

// GET    /api/sessions/:sessionId/dev-qr - API hỗ trợ test Postman
router.get('/:sessionId/dev-qr', validateIdParams('sessionId'), sessionController.devGetQr);

module.exports = router;
