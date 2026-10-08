const AppError = require('../utils/AppError');
const net = require('net');

const validateCheckin = (req, res, next) => {
    const { token, latitude, longitude, ip_address } = req.body;

    if (typeof token !== 'string' || token.trim() === '') {
        throw new AppError('QR token is required', 400);
    }
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
        throw new AppError('latitude must be a number between -90 and 90', 400);
    }
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
        throw new AppError('longitude must be a number between -180 and 180', 400);
    }
    
    // Lấy IP từ payload (cho mục đích giả lập/test) hoặc từ Request thực tế
    let clientIp = ip_address;
    if (!clientIp) {
        clientIp = req.ip || req.connection.remoteAddress;
        if (clientIp.startsWith('::ffff:')) {
            clientIp = clientIp.substring(7); // Dọn dẹp IPv4-mapped IPv6
        }
    }

    if (!net.isIP(clientIp)) {
        throw new AppError('Invalid IP address', 400);
    }

    req.body = { 
        token: token.trim(), 
        latitude, 
        longitude, 
        ipAddress: clientIp 
    };
    
    next();
};

module.exports = { validateCheckin };
