/**
 * LeaveRequest Controller - Tiếp nhận và xử lý HTTP Request cho đơn xin nghỉ phép.
 */
const leaveRequestService = require('../services/leaveRequest.service');
const { sendSuccess } = require('../utils/response');

const submit = async (req, res) => {
    const leaveRequest = await leaveRequestService.submitRequest(req.user, req.body);
    return sendSuccess(res, {
        statusCode: 201,
        message: 'Gửi đơn xin nghỉ phép thành công',
        data: { leaveRequest },
    });
};

const list = async (req, res) => {
    const leaveRequests = await leaveRequestService.getLeaveRequests(req.user, req.query);
    return sendSuccess(res, {
        message: 'Lấy danh sách đơn xin nghỉ phép thành công',
        data: { leaveRequests },
    });
};

const listByCourse = async (req, res) => {
    const courseId = Number(req.params.courseId);
    const leaveRequests = await leaveRequestService.getLeaveRequests(req.user, {
        courseId,
        status: req.query.status,
    });
    return sendSuccess(res, {
        message: 'Lấy danh sách đơn xin nghỉ phép theo lớp thành công',
        data: { leaveRequests },
    });
};

const getById = async (req, res) => {
    const leaveRequest = await leaveRequestService.getLeaveRequestById(req.user, Number(req.params.id));
    return sendSuccess(res, {
        message: 'Lấy chi tiết đơn xin nghỉ phép thành công',
        data: { leaveRequest },
    });
};

const review = async (req, res) => {
    const leaveRequest = await leaveRequestService.reviewLeaveRequest(req.user, Number(req.params.id), req.body);
    const actionText = leaveRequest.status === 'APPROVED' ? 'Duyệt' : 'Từ chối';
    return sendSuccess(res, {
        message: `${actionText} đơn xin nghỉ phép thành công`,
        data: { leaveRequest },
    });
};

module.exports = {
    submit,
    list,
    listByCourse,
    getById,
    review,
};
