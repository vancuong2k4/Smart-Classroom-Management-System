const reportModel = require('../models/report.model');
const courseService = require('./course.service');
const AppError = require('../utils/AppError');

const getCourseReport = async (user, courseId) => {
    // Chỉ Admin hoặc GV phụ trách lớp mới được xem báo cáo
    await courseService.getManageableCourse(user, courseId);
    return reportModel.getCourseReport(courseId);
};

const exportCourseReportCsv = async (user, courseId) => {
    const reportData = await getCourseReport(user, courseId);
    const course = await courseService.getCourse(user, courseId);

    // Xây dựng nội dung file CSV
    let csvContent = '\uFEFF'; // Thêm BOM để Excel đọc đúng tiếng Việt có dấu (UTF-8)
    
    // Header
    csvContent += `Báo cáo điểm danh lớp:,${course.code} - ${course.name}\n`;
    csvContent += `Giảng viên:,${user.username}\n`;
    csvContent += `Ngày xuất báo cáo:,${new Date().toISOString()}\n\n`;
    
    // Bảng dữ liệu
    csvContent += 'MSSV/Username,Có mặt,Đi muộn,Vắng mặt,Cố tình gian lận (Lỗi vị trí),Tổng số buổi\n';

    reportData.forEach(row => {
        csvContent += `${row.username},${row.present_count},${row.late_count},${row.absent_count},${row.invalid_count},${row.total_sessions}\n`;
    });

    return csvContent;
};

const getStudentHistory = async (user, courseId = null) => {
    // Nếu truyền courseId, kiểm tra xem SV có đăng ký lớp đó không
    if (courseId) {
        await courseService.getCourse(user, courseId);
    }
    return reportModel.getStudentHistory(user.id, courseId);
};

module.exports = {
    getCourseReport,
    exportCourseReportCsv,
    getStudentHistory
};
