/**
 * Enrollment Controller - Quản lý sinh viên trong lớp.
 */
const enrollmentService = require('../services/enrollment.service');
const { sendSuccess } = require('../utils/response');

const list = async (req, res) => {
    const students = await enrollmentService.listStudents(req.user, Number(req.params.id));
    return sendSuccess(res, {
        message: 'Get students successfully',
        data: { students },
    });
};

const add = async (req, res) => {
    const result = await enrollmentService.addStudents(
        req.user,
        Number(req.params.id),
        req.body.usernames
    );
    return sendSuccess(res, {
        message: `Added ${result.added.length} student(s) to the course`,
        data: result,
    });
};

const remove = async (req, res) => {
    await enrollmentService.removeStudent(
        req.user,
        Number(req.params.id),
        Number(req.params.studentId)
    );
    return sendSuccess(res, {
        message: 'Student removed from the course',
    });
};

module.exports = { list, add, remove };
