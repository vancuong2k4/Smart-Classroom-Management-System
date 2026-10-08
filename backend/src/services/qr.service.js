const crypto = require('crypto');
const { redisClient } = require('../config/redis');
const sessionConfig = require('../config/session');

// TTL = thời gian đổi mã (10s) + thời gian ân hạn mạng chậm (5s) = 15s
const TTL_SECONDS = Math.floor((sessionConfig.qrRotateIntervalMs + sessionConfig.qrTokenGraceMs) / 1000);

/**
 * Sinh mã token ngẫu nhiên và lưu vào Redis.
 * Key: `qr:<token>`, Value: `sessionId`
 */
const generateToken = async (sessionId) => {
    const token = crypto.randomBytes(16).toString('hex');
    
    await redisClient.set(`qr:${token}`, sessionId.toString(), {
        EX: TTL_SECONDS
    });

    return {
        token,
        // Frontend dùng expiresInMs để biết bao lâu nữa server sẽ đẩy token mới (hiển thị vòng đếm ngược)
        expiresInMs: sessionConfig.qrRotateIntervalMs 
    };
};

/**
 * Xác thực token quét được từ sinh viên.
 * Trả về sessionId nếu hợp lệ, null nếu không có/đã hết hạn.
 */
const verifyToken = async (token) => {
    if (!token) return null;
    const sessionId = await redisClient.get(`qr:${token}`);
    return sessionId ? parseInt(sessionId, 10) : null;
};

module.exports = { generateToken, verifyToken };
