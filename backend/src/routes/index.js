/**
 * Router tổng - gom tất cả các module route lại một chỗ.
 * Khi thêm module mới (courses, sessions, attendance...) chỉ cần đăng ký tại đây.
 */
const express = require('express');
const authRoutes = require('./auth.routes');
const courseRoutes = require('./course.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);

module.exports = router;
