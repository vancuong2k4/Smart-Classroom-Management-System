const { verifyToken } = require('../services/auth.service');
const sessionModel = require('../models/session.model');
const qrService = require('../services/qr.service');
const sessionConfig = require('../config/session');
const ROLES = require('../constants/roles');

const setupSocket = (io) => {
    // 1. Authentication Middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));
        
        try {
            // Giải mã JWT, gắn thông tin vào socket để dùng về sau
            socket.user = verifyToken(token);
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    // 2. Xử lý các sự kiện Connection
    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.id} (UserID: ${socket.user.sub}, Role: ${socket.user.role})`);

        // Giảng viên mở máy chiếu và "join" vào phòng của phiên điểm danh
        socket.on('join_session', async ({ sessionId }) => {
            if (!sessionId) {
                return socket.emit('error', { message: 'sessionId is required' });
            }

            try {
                const session = await sessionModel.findById(sessionId);
                if (!session) {
                    return socket.emit('error', { message: 'Session not found' });
                }

                // Chỉ ADMIN hoặc GV phụ trách mới được xem mã QR máy chiếu
                if (socket.user.role !== ROLES.ADMIN && socket.user.sub !== session.lecturer_id) {
                    return socket.emit('error', { message: 'Forbidden' });
                }

                if (session.status !== 'ACTIVE') {
                    return socket.emit('session_expired', { message: 'Session is no longer active' });
                }

                const roomName = `session_${sessionId}`;
                socket.join(roomName);
                console.log(`[Socket] User ${socket.user.sub} joined room ${roomName}`);

                // Sinh và gửi ngay 1 mã QR đầu tiên để Client không phải chờ tới chu kỳ sau
                const qrData = await qrService.generateToken(sessionId);
                socket.emit('new_qr', qrData);
            } catch (err) {
                console.error('[Socket] join_session error:', err);
                socket.emit('error', { message: 'Internal server error' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
        });
    });

    // 3. Worker Background: Lặp mỗi 10 giây để gen QR mới cho TẤT CẢ các phòng
    setInterval(async () => {
        const rooms = io.sockets.adapter.rooms;
        for (const [room, clients] of rooms.entries()) {
            if (room.startsWith('session_') && clients.size > 0) {
                const sessionId = parseInt(room.split('_')[1], 10);
                
                try {
                    // Kiểm tra xem phiên còn sống trong DB không
                    const session = await sessionModel.findById(sessionId);
                    
                    if (!session || session.status !== 'ACTIVE') {
                        // Báo cho mọi người trong phòng biết phiên đã kết thúc
                        io.to(room).emit('session_expired', { message: 'Session has ended' });
                        // Đuổi tất cả ra khỏi phòng
                        io.in(room).socketsLeave(room);
                        continue;
                    }
                    
                    // Phiên vẫn đang mở => Gen mã QR động mới (có TTL)
                    const qrData = await qrService.generateToken(sessionId);
                    
                    // Phát (broadcast) cho tất cả client trong phòng học này (máy chiếu của GV)
                    io.to(room).emit('new_qr', qrData);
                    
                } catch (err) {
                    console.error(`[Socket] QR generation error for room ${room}:`, err);
                }
            }
        }
    }, sessionConfig.qrRotateIntervalMs);
};

module.exports = setupSocket;
