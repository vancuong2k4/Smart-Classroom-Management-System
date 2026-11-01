const AppError = require('../utils/AppError');
const { normalizeCidr } = require('../utils/network');

const validateOpenSession = (req, res, next) => {
    const { latitude, longitude, ip_range, radius_meters, late_after_minutes, duration_minutes, durationMinutes } = req.body || {};

    const lat = typeof latitude === 'number' ? latitude : 10.762622;
    const lng = typeof longitude === 'number' ? longitude : 106.660172;

    if (lat < -90 || lat > 90) {
        throw new AppError('latitude must be a number between -90 and 90', 400);
    }
    if (lng < -180 || lng > 180) {
        throw new AppError('longitude must be a number between -180 and 180', 400);
    }

    let ipRange = null;
    const rawIpRange = ip_range || process.env.SCHOOL_IP_RANGE || '0.0.0.0/0';
    ipRange = normalizeCidr(rawIpRange);
    if (!ipRange) throw new AppError('ip_range must be a valid IP or CIDR (e.g. 192.168.1.0/24)', 400);

    const dur = duration_minutes !== undefined ? Number(duration_minutes) : (durationMinutes !== undefined ? Number(durationMinutes) : undefined);

    req.body = {
        latitude: lat,
        longitude: lng,
        ipRange,
        radiusMeters: radius_meters !== undefined ? Number(radius_meters) : undefined,
        lateAfterMinutes: late_after_minutes !== undefined ? Number(late_after_minutes) : undefined,
        durationMinutes: dur,
    };
    next();
};

module.exports = { validateOpenSession };
