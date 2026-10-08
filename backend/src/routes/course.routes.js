const express = require('express');
const courseController = require('../controllers/course.controller');
const enrollmentController = require('../controllers/enrollment.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateIdParams } = require('../validators/common.validator');
const {
    validateCreateCourse,
    validateUpdateCourse,
    validateAddStudents,
} = require('../validators/course.validator');
const ROLES = require('../constants/roles');

const router = express.Router();
const { ADMIN, LECTURER } = ROLES;

// Tất cả API lớp học đều yêu cầu đăng nhập
router.use(authenticate);

// ===== Courses =====
// GET    /api/courses       - ADMIN: tất cả | LECTURER: lớp mình dạy | STUDENT: lớp đã đăng ký
router.get('/', courseController.list);
// POST   /api/courses       - Tạo lớp
router.post('/', authorize(ADMIN, LECTURER), validateCreateCourse, courseController.create);
// GET    /api/courses/:id   - Xem chi tiết (kiểm tra quyền sở hữu/đăng ký ở Service)
router.get('/:id', validateIdParams('id'), courseController.getById);
// PATCH  /api/courses/:id   - Sửa lớp (chỉ ADMIN được đổi lecturer_id)
router.patch('/:id', authorize(ADMIN, LECTURER), validateIdParams('id'), validateUpdateCourse, courseController.update);
// DELETE /api/courses/:id   - Xóa lớp (CHỈ ADMIN vì xóa cascade cả lịch sử điểm danh)
router.delete('/:id', authorize(ADMIN), validateIdParams('id'), courseController.remove);

// ===== Sessions (Phiên điểm danh) =====
const sessionController = require('../controllers/session.controller');
const { validateOpenSession } = require('../validators/session.validator');

// POST   /api/courses/:id/sessions             - Mở phiên điểm danh
router.post('/:id/sessions', authorize(ADMIN, LECTURER), validateIdParams('id'), validateOpenSession, sessionController.open);
// GET    /api/courses/:id/sessions             - Lịch sử các phiên
router.get('/:id/sessions', validateIdParams('id'), sessionController.list);

// ===== Enrollments (SV trong lớp) =====
// GET    /api/courses/:id/students             - Danh sách SV
router.get('/:id/students', authorize(ADMIN, LECTURER), validateIdParams('id'), enrollmentController.list);
// POST   /api/courses/:id/students             - Thêm nhiều SV { usernames: [...] }
router.post('/:id/students', authorize(ADMIN, LECTURER), validateIdParams('id'), validateAddStudents, enrollmentController.add);
// DELETE /api/courses/:id/students/:studentId  - Xóa SV khỏi lớp
router.delete('/:id/students/:studentId', authorize(ADMIN, LECTURER), validateIdParams('id', 'studentId'), enrollmentController.remove);

module.exports = router;
