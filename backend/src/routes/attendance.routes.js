const express = require('express');
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateCheckin } = require('../validators/attendance.validator');
const ROLES = require('../constants/roles');

const router = express.Router();
router.use(authenticate);

// POST /api/attendance/checkin - API dành riêng cho Sinh viên điểm danh
router.post('/checkin', authorize(ROLES.STUDENT), validateCheckin, attendanceController.checkin);

module.exports = router;
