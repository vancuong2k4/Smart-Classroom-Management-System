const AppError = require('../utils/AppError');
const { normalizeCidr } = require('../utils/network');

const validateOpenSession = (req, res, next) => {
    const { latitude, longitude, ip_range, radius_meters, late_after_minutes, duration_minutes } = req.body;

    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
        throw new AppError('latitude must be a number between -90 and 90', 400);
    }
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
        throw new AppError('longitude must be a number between -180 and 180', 400);
    }

    let ipRange = null;
    if (ip_range !== undefined && ip_range !== null) {
        ipRange = normalizeCidr(ip_range);
        if (!ipRange) throw new AppError('ip_range must be a valid IP or CIDR (e.g. 192.168.1.0/24)', 400);
    }

    req.body = {
        latitude,
        longitude,
        ipRange,
        radiusMeters: radius_meters !== undefined ? Number(radius_meters) : undefined,
        lateAfterMinutes: late_after_minutes !== undefined ? Number(late_after_minutes) : undefined,
        durationMinutes: duration_minutes !== undefined ? Number(duration_minutes) : undefined,
    };
    next();
};

module.exports = { validateOpenSession };
