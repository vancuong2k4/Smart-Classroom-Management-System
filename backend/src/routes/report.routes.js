const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateIdParams } = require('../validators/common.validator');
const ROLES = require('../constants/roles');

const router = express.Router();

// Tất cả API báo cáo đều yêu cầu đăng nhập
router.use(authenticate);

// ==========================================
// DÀNH CHO GIẢNG VIÊN / ADMIN
// ==========================================
// Xem báo cáo tổng quan của 1 lớp
router.get('/courses/:courseId', authorize(ROLES.ADMIN, ROLES.LECTURER), validateIdParams('courseId'), reportController.courseReport);

// Xuất file CSV báo cáo của 1 lớp
router.get('/courses/:courseId/export', authorize(ROLES.ADMIN, ROLES.LECTURER), validateIdParams('courseId'), reportController.exportCsv);


// ==========================================
// DÀNH CHO SINH VIÊN
// ==========================================
// Sinh viên xem lịch sử điểm danh của chính mình (hỗ trợ ?courseId=...)
router.get('/me', authorize(ROLES.STUDENT), reportController.studentHistory);


module.exports = router;
