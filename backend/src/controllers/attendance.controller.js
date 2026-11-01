const attendanceService = require('../services/attendance.service');
const { sendSuccess } = require('../utils/response');

const checkin = async (req, res) => {
    const result = await attendanceService.checkin(req.user, req.body);
    
    // Broadcast realtime event attendance_scanned cho máy chiếu của giảng viên
    const io = req.app.get('io');
    if (io && result.record?.session_id) {
        io.to(`session_${result.record.session_id}`).emit('attendance_scanned', {
            studentId: req.user.id,
            username: req.user.username,
            status: result.status,
            distanceMeters: result.distanceMeters,
            scannedAt: result.record.created_at || new Date().toISOString()
        });
    }

    return sendSuccess(res, {
        message: 'Điểm danh thành công',
        data: result
    });
};

module.exports = { checkin };
