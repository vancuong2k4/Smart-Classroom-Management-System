/**
 * Router tổng - gom tất cả các module route lại một chỗ.
 * Khi thêm module mới (courses, sessions, attendance...) chỉ cần đăng ký tại đây.
 */
const express = require('express');
const authRoutes = require('./auth.routes');
const courseRoutes = require('./course.routes');
const sessionRoutes = require('./session.routes');
const attendanceRoutes = require('./attendance.routes');
const reportRoutes = require('./report.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/sessions', sessionRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
