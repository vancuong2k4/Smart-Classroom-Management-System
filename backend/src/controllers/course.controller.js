/**
 * Course Controller - Chỉ nhận request, gọi Service và trả response.
 */
const courseService = require('../services/course.service');
const { sendSuccess } = require('../utils/response');

const create = async (req, res) => {
    const course = await courseService.createCourse(req.user, req.body);
    return sendSuccess(res, {
        statusCode: 201,
        message: 'Course created successfully',
        data: { course },
    });
};

const list = async (req, res) => {
    const courses = await courseService.listCourses(req.user);
    return sendSuccess(res, {
        message: 'Get courses successfully',
        data: { courses },
    });
};

const getById = async (req, res) => {
    const course = await courseService.getCourse(req.user, Number(req.params.id));
    return sendSuccess(res, {
        message: 'Get course successfully',
        data: { course },
    });
};

const update = async (req, res) => {
    const course = await courseService.updateCourse(req.user, Number(req.params.id), req.body);
    return sendSuccess(res, {
        message: 'Course updated successfully',
        data: { course },
    });
};

const remove = async (req, res) => {
    await courseService.deleteCourse(Number(req.params.id));
    return sendSuccess(res, {
        message: 'Course deleted successfully',
    });
};

module.exports = { create, list, getById, update, remove };
