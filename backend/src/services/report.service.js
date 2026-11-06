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
    csvContent += `Giảng viên:,${course.lecturer_username || user.username}\n`;
    csvContent += `Tổng số buổi học phần:,${course.total_sessions || 10}\n`;
    csvContent += `Số buổi vắng tối đa cho phép:,${course.max_absences !== undefined ? course.max_absences : 2}\n`;
    csvContent += `Ngày xuất báo cáo:,${new Date().toISOString()}\n\n`;
    
    // Bảng dữ liệu
    csvContent += 'MSSV/Username,Họ và tên,Email,Có mặt,Đi muộn,Nghỉ có phép,Vắng không phép,Lỗi vị trí/Gian lận,Số buổi đã diễn ra,Trạng thái cấm thi\n';

    reportData.forEach(row => {
        const bannedText = row.is_banned ? 'CẤM THI' : 'ĐỦ ĐIỀU KIỆN';
        csvContent += `"${row.username}","${row.full_name || ''}","${row.email || ''}",${row.present_count},${row.late_count},${row.excused_count},${row.absent_count},${row.invalid_count},${row.held_sessions},"${bannedText}"\n`;
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
