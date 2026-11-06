const express = require('express');
const leaveRequestController = require('../controllers/leaveRequest.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateIdParams } = require('../validators/common.validator');
const { validateSubmit, validateReview } = require('../validators/leaveRequest.validator');
const ROLES = require('../constants/roles');

const router = express.Router();
const { ADMIN, LECTURER, STUDENT } = ROLES;

// Tất cả endpoints đều yêu cầu đăng nhập
router.use(authenticate);

// POST  /api/leave-requests                - Sinh viên nộp đơn xin nghỉ phép
router.post('/', authorize(STUDENT), validateSubmit, leaveRequestController.submit);

// GET   /api/leave-requests                - Danh sách đơn (SV: đơn của mình, GV: lớp mình dạy, Admin: tất cả)
router.get('/', authorize(ADMIN, LECTURER, STUDENT), leaveRequestController.list);

// GET   /api/leave-requests/course/:courseId - Danh sách đơn theo lớp học
router.get('/course/:courseId', authorize(ADMIN, LECTURER), validateIdParams('courseId'), leaveRequestController.listByCourse);

// GET   /api/leave-requests/:id            - Chi tiết 1 đơn
router.get('/:id', authorize(ADMIN, LECTURER, STUDENT), validateIdParams('id'), leaveRequestController.getById);

// PATCH /api/leave-requests/:id            - Phê duyệt / Từ chối đơn (Giảng viên / Admin)
router.patch('/:id', authorize(ADMIN, LECTURER), validateIdParams('id'), validateReview, leaveRequestController.review);

module.exports = router;
