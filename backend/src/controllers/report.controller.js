const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/response');

const courseReport = async (req, res) => {
    const report = await reportService.getCourseReport(req.user, Number(req.params.courseId));
    return sendSuccess(res, {
        message: 'Lấy báo cáo điểm danh thành công',
        data: { report }
    });
};

const exportCsv = async (req, res) => {
    const courseId = Number(req.params.courseId);
    const csvData = await reportService.exportCourseReportCsv(req.user, courseId);
    
    // Trả về file định dạng CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Attendance_Report_Course_${courseId}.csv"`);
    return res.status(200).send(csvData);
};

const studentHistory = async (req, res) => {
    const courseId = req.query.courseId ? Number(req.query.courseId) : null;
    const history = await reportService.getStudentHistory(req.user, courseId);
    return sendSuccess(res, {
        message: 'Lấy lịch sử cá nhân thành công',
        data: { history }
    });
};

module.exports = { courseReport, exportCsv, studentHistory };
