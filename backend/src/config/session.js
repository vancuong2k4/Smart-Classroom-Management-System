/**
 * Cấu hình phiên điểm danh & mã QR động.
 * Tất cả đều có giá trị mặc định hợp lý, có thể ghi đè qua biến môi trường.
 */
const toInt = (value, fallback) => {
    const n = Number.parseInt(value, 10);
    return Number.isInteger(n) && n > 0 ? n : fallback;
};

module.exports = Object.freeze({
    // Mã QR đổi sau mỗi N giây (PROJECT_CONTEXT: 10 giây)
    qrRotateIntervalMs: toInt(process.env.QR_ROTATE_INTERVAL_SECONDS, 10) * 1000,

    // Thời gian "ân hạn" sau khi QR đã đổi mà token cũ vẫn còn hợp lệ.
    // Lý do: SV quét ở giây thứ 9.8 nhưng request tới server ở giây 11 (mạng chậm)
    // => nếu không có ân hạn, SV trung thực bị từ chối oan.
    qrTokenGraceMs: toInt(process.env.QR_TOKEN_GRACE_SECONDS, 5) * 1000,

    // Dải IP mặc định của trường (dùng khi GV không truyền ip_range lúc mở phiên)
    defaultIpRange: process.env.SCHOOL_IP_RANGE || null,

    // Giới hạn khi mở phiên
    defaultDurationMinutes: 15,
    maxDurationMinutes: 300,
    defaultRadiusMeters: 50,
    minRadiusMeters: 10,
    maxRadiusMeters: 1000,
    defaultLateAfterMinutes: 10,
});
