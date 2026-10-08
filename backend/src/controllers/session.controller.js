const sessionService = require('../services/session.service');
const { sendSuccess } = require('../utils/response');

const open = async (req, res) => {
    const session = await sessionService.openSession(req.user, Number(req.params.id), req.body);
    return sendSuccess(res, {
        statusCode: 201,
        message: 'Session opened successfully',
        data: { session }
    });
};

const list = async (req, res) => {
    const sessions = await sessionService.listByCourse(req.user, Number(req.params.id));
    return sendSuccess(res, {
        message: 'Get sessions successfully',
        data: { sessions }
    });
};

const attendanceModel = require('../models/attendance.model');

const getById = async (req, res) => {
    const session = await sessionService.getSession(req.user, Number(req.params.sessionId));
    
    // Nếu là giảng viên hoặc Admin, đính kèm lịch sử điểm danh của phiên
    let attendance_records = undefined;
    if (req.user.role === 'ADMIN' || req.user.role === 'LECTURER') {
        attendance_records = await attendanceModel.findBySession(session.id);
    }
    
    return sendSuccess(res, {
        message: 'Get session successfully',
        data: { session, attendance_records }
    });
};

const close = async (req, res) => {
    await sessionService.closeSession(req.user, Number(req.params.sessionId));
    return sendSuccess(res, {
        message: 'Session closed successfully'
    });
};

const qrService = require('../services/qr.service');
const devGetQr = async (req, res) => {
    // API ẩn chỉ dùng để test Postman (Giả lập việc Socket.io phát mã)
    const tokenData = await qrService.generateToken(Number(req.params.sessionId));
    return sendSuccess(res, {
        message: 'Dev QR Token generated',
        data: tokenData
    });
};

module.exports = { open, list, getById, close, devGetQr };
