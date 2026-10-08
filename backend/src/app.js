const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// ==========================================
// 1. SECURITY MIDDLEWARES
// ==========================================
// Helmet: Thiết lập các HTTP header bảo mật (chống XSS, Clickjacking...)
app.use(helmet());

// CORS: Cho phép các ứng dụng Frontend (Web/Mobile) gọi API mà không bị chặn
app.use(cors({
    origin: '*', // Mặc định mở. Trong production nên thay bằng domain thực tế.
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==========================================
// 2. RATE LIMITING (CHỐNG SPAM / DDOS)
// ==========================================
// Giới hạn chung: 1 IP chỉ được gọi tối đa 150 request / 15 phút
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 150,
    message: { status: 'error', message: 'Bạn đã truy cập quá nhiều lần. Vui lòng thử lại sau 15 phút.' }
});
app.use('/api', generalLimiter);

// Giới hạn khắt khe hơn cho API Check-in: Chống sinh viên dùng tool click liên tục (10 lần / 1 phút)
const checkinLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 10,
    message: { status: 'error', message: 'Bạn thao tác quá nhanh, vui lòng chờ 1 phút!' }
});
app.use('/api/attendance/checkin', checkinLimiter);

// ==========================================
// 3. CORE MIDDLEWARES & ROUTES
// ==========================================
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;
