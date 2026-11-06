/**
 * Kết nối Redis dùng chung cho toàn bộ ứng dụng.
 *
 * Redis lưu các dữ liệu "sống ngắn" (QR token TTL vài giây), nên KHÔNG dùng
 * PostgreSQL cho việc này: Redis tự xóa key khi hết hạn và đọc/ghi nhanh hơn nhiều.
 */
const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        // Tự kết nối lại khi Redis bị mất kết nối: chờ tăng dần, tối đa 5 giây
        reconnectStrategy: (retries) => Math.min(retries * 200, 5000),
    },
});

// Bắt buộc lắng nghe 'error', nếu không node-redis sẽ làm crash process khi mất kết nối
let lastErrorLoggedAt = 0;
client.on('error', (err) => {
    // Tránh spam log mỗi lần thử kết nối lại
    if (Date.now() - lastErrorLoggedAt > 10000) {
        console.error('[Redis] Connection error:', err.message);
        lastErrorLoggedAt = Date.now();
    }
});
client.on('ready', () => console.log('✅ Redis connected'));

/**
 * Mở kết nối (gọi 1 lần khi khởi động server).
 */
const connectRedis = async () => {
    if (!client.isOpen) {
        await client.connect();
    }
    return client;
};

module.exports = { redisClient: client, connectRedis };
