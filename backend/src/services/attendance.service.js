const attendanceModel = require('../models/attendance.model');
const enrollmentModel = require('../models/enrollment.model');
const qrService = require('./qr.service');
const AppError = require('../utils/AppError');
const ROLES = require('../constants/roles');

const checkin = async (user, { token, latitude, longitude, ipAddress }) => {
    // 1. Xác thực Token quét được
    const sessionId = await qrService.verifyToken(token);
    if (!sessionId) {
        throw new AppError('Mã QR không hợp lệ hoặc đã hết hạn', 400);
    }

    // 2. Fetch thông tin phiên + Tính toán ngay trên Database (Khoảng cách, IP)
    let context;
    try {
        context = await attendanceModel.checkSessionContext(sessionId, longitude, latitude, ipAddress);
    } catch (err) {
        if (err.message.includes('Invalid IP address format')) {
            throw new AppError('Định dạng IP không tương thích với mạng của nhà trường', 400);
        }
        throw err;
    }

    if (!context) throw new AppError('Không tìm thấy phiên điểm danh', 404);

    if (context.session_status !== 'ACTIVE') {
        throw new AppError('Phiên điểm danh đã kết thúc', 403);
    }

    // 3. Phân quyền: Sinh viên phải nằm trong danh sách lớp
    const isEnrolled = await enrollmentModel.isEnrolled(context.course_id, user.id);
    if (!isEnrolled) {
        throw new AppError('Bạn không có trong danh sách đăng ký của lớp học này', 403);
    }

    // 4. Xử lý logic nghiệp vụ chống gian lận
    let finalStatus = 'PRESENT';
    let errorMessage = null;

    if (!context.is_ip_valid) {
        finalStatus = 'INVALID_LOCATION';
        errorMessage = 'Điểm danh thất bại: Bạn đang không kết nối vào mạng Wi-Fi của trường.';
    } else if (context.distance_meters > context.radius_meters) {
        finalStatus = 'INVALID_LOCATION';
        errorMessage = `Điểm danh thất bại: Bạn cách bục giảng ${Math.round(context.distance_meters)}m (Cho phép tối đa ${context.radius_meters}m). Vui lòng di chuyển vào trong lớp.`;
    } else {
        // Kiểm tra đi muộn
        const minutesSinceStart = (Date.now() - new Date(context.start_time).getTime()) / 60000;
        if (minutesSinceStart > context.late_after_minutes) {
            finalStatus = 'LATE';
        }
    }

    // 5. Luôn ghi lại kết quả quét mã (Dù ngoài khoảng cách vẫn lưu để GV kiểm tra lịch sử gian lận)
    const record = await attendanceModel.upsertRecord({
        sessionId,
        studentId: user.id,
        lon: longitude,
        lat: latitude,
        ipAddress,
        status: finalStatus
    });

    // 6. Trả lỗi nếu vi phạm nội quy để Front-end hiển thị popup đỏ
    if (errorMessage) {
        throw new AppError(errorMessage, 400);
    }

    return {
        status: finalStatus,
        distanceMeters: Math.round(context.distance_meters),
        record
    };
};

module.exports = { checkin };
