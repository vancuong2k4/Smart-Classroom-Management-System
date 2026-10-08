const attendanceService = require('../services/attendance.service');
const { sendSuccess } = require('../utils/response');

const checkin = async (req, res) => {
    const result = await attendanceService.checkin(req.user, req.body);
    
    return sendSuccess(res, {
        message: 'Điểm danh thành công',
        data: result
    });
};

module.exports = { checkin };
