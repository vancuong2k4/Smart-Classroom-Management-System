// Server Mock API độc lập cho Smart Classroom Management System (Task T009 & T010)
// Chạy bằng: node mock-server.js hoặc npm run mock
import http from 'node:http';
import process from 'node:process';
import { generateMockToken, mockCourses, mockUser, mockCourseStudents } from './src/mock/mockData.js';

const DEFAULT_PORT = process.env.PORT || 3000;

function createServer(port) {
  const server = http.createServer((req, res) => {
    const url = req.url ? req.url.split('?')[0] : '';

    // Cấu hình CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // 1. Mock API POST /api/auth/login
    if (url === '/api/auth/login' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', (chunk) => {
        bodyStr += chunk;
      });
      req.on('end', () => {
        try {
          const body = bodyStr ? JSON.parse(bodyStr) : {};
          const { username, password } = body;

          if (username === 'error' || password === 'wrong' || !username) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(
              JSON.stringify({
                success: false,
                message: 'Tài khoản hoặc mật khẩu không chính xác.',
              })
            );
            return;
          }

          const user = {
            ...mockUser,
            username: username || mockUser.username,
            fullName: username === 'gv_nguyenan' ? mockUser.fullName : `Giảng viên ${username}`,
          };
          const token = generateMockToken(user);

          console.log(`[Mock Server] [200 OK] Đăng nhập: ${user.fullName}`);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              success: true,
              message: 'Đăng nhập thành công',
              token,
              user,
            })
          );
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, message: 'Body JSON không hợp lệ' }));
        }
      });
      return;
    }

    // 2. Mock API GET /api/courses
    if (url === '/api/courses' && req.method === 'GET') {
      console.log(`[Mock Server] [200 OK] Lấy danh sách khóa học (${mockCourses.length} khóa học)`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          success: true,
          data: mockCourses,
        })
      );
      return;
    }

    // 3. Mock API POST /api/courses (Tạo lớp học mới)
    if (url === '/api/courses' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', (chunk) => {
        bodyStr += chunk;
      });
      req.on('end', () => {
        try {
          const body = bodyStr ? JSON.parse(bodyStr) : {};
          if (!body.code || !body.name) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: 'Mã lớp và tên môn học không được để trống.' }));
            return;
          }

          const newId = `CS${Math.floor(100 + Math.random() * 900)}`;
          const newCourse = {
            id: newId,
            code: body.code.trim().toUpperCase(),
            name: body.name.trim(),
            room: body.room?.trim() || 'Chưa xếp phòng',
            schedule: body.schedule?.trim() || 'Chưa xếp lịch',
            studentsCount: 0,
            status: 'Mới tạo',
          };

          mockCourses.unshift(newCourse);
          mockCourseStudents[newId] = [];

          console.log(`[Mock Server] [201 Created] Tạo lớp học: ${newCourse.name} (${newCourse.code})`);
          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: true, message: 'Tạo lớp học mới thành công!', data: newCourse }));
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, message: 'Body JSON không hợp lệ' }));
        }
      });
      return;
    }

    // 4. Mock API GET /api/courses/:id/students
    const matchGetStudents = url.match(/^\/api\/courses\/([^/]+)\/students\/?$/);
    if (matchGetStudents && req.method === 'GET') {
      const courseId = matchGetStudents[1];
      const students = mockCourseStudents[courseId] || [];
      console.log(`[Mock Server] [200 OK] Lấy danh sách sinh viên lớp ${courseId} (${students.length} sinh viên)`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: true, data: students }));
      return;
    }

    // 5. Mock API POST /api/courses/:id/students
    const matchPostStudents = url.match(/^\/api\/courses\/([^/]+)\/students\/?$/);
    if (matchPostStudents && req.method === 'POST') {
      const courseId = matchPostStudents[1];
      let bodyStr = '';
      req.on('data', (chunk) => {
        bodyStr += chunk;
      });
      req.on('end', () => {
        try {
          const body = bodyStr ? JSON.parse(bodyStr) : {};
          let usernames = [];
          if (Array.isArray(body.usernames)) {
            usernames = body.usernames;
          } else if (typeof body.usernames === 'string') {
            usernames = body.usernames.split(/[\n,;]+/).map((u) => u.trim()).filter(Boolean);
          } else if (typeof body.username === 'string') {
            usernames = [body.username.trim()];
          }

          if (usernames.length === 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập ít nhất một username.' }));
            return;
          }

          if (!mockCourseStudents[courseId]) {
            mockCourseStudents[courseId] = [];
          }

          const existingList = mockCourseStudents[courseId];
          const addedStudents = [];

          usernames.forEach((u) => {
            const cleanUser = u.trim();
            if (!existingList.some((s) => s.username === cleanUser)) {
              const studentObj = {
                id: `ST${Math.floor(1000 + Math.random() * 9000)}`,
                username: cleanUser,
                fullName: `Sinh viên ${cleanUser}`,
                email: `${cleanUser}@student.edu.vn`,
                status: 'Đang học',
                attendanceRate: '100%',
              };
              existingList.push(studentObj);
              addedStudents.push(studentObj);
            }
          });

          const course = mockCourses.find((c) => c.id === courseId);
          if (course) {
            course.studentsCount = existingList.length;
          }

          console.log(`[Mock Server] [200 OK] Đã thêm ${addedStudents.length} sinh viên vào lớp ${courseId}`);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: true, message: `Đã thêm ${addedStudents.length} sinh viên thành công`, data: existingList }));
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // 6. Mock API DELETE /api/courses/:id/students/:studentId
    const matchDeleteStudent = url.match(/^\/api\/courses\/([^/]+)\/students\/([^/]+)\/?$/);
    if (matchDeleteStudent && req.method === 'DELETE') {
      const courseId = matchDeleteStudent[1];
      const studentId = matchDeleteStudent[2];

      if (mockCourseStudents[courseId]) {
        mockCourseStudents[courseId] = mockCourseStudents[courseId].filter(
          (s) => s.id !== studentId && s.username !== studentId
        );
        const course = mockCourses.find((c) => c.id === courseId);
        if (course) {
          course.studentsCount = mockCourseStudents[courseId].length;
        }
      }

      console.log(`[Mock Server] [200 OK] Đã xóa sinh viên ${studentId} khỏi lớp ${courseId}`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: true, message: 'Đã xóa sinh viên khỏi lớp học thành công' }));
      return;
    }

    // 7. Mock API POST /api/auth/logout
    if (url === '/api/auth/logout' && req.method === 'POST') {
      console.log(`[Mock Server] [200 OK] Đăng xuất thành công`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: true, message: 'Đăng xuất thành công' }));
      return;
    }

    // Endpoint không tồn tại
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success: false, message: `Route ${req.method} ${url} không tồn tại trên Mock Server.` }));
  });

  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Smart Classroom Mock API Server đang chạy tại:`);
    console.log(`   👉 http://localhost:${port}`);
    console.log(`------------------------------------------------------`);
    console.log(`📌 Các API hỗ trợ:`);
    console.log(`   - POST   http://localhost:${port}/api/auth/login`);
    console.log(`   - GET    http://localhost:${port}/api/courses`);
    console.log(`   - POST   http://localhost:${port}/api/courses`);
    console.log(`   - GET    http://localhost:${port}/api/courses/:id/students`);
    console.log(`   - POST   http://localhost:${port}/api/courses/:id/students`);
    console.log(`   - DELETE http://localhost:${port}/api/courses/:id/students/:studentId`);
    console.log(`   - POST   http://localhost:${port}/api/auth/logout`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Mock Server] Cổng ${port} đang bị chiếm dụng. Đang thử cổng ${Number(port) + 1}...`);
      createServer(Number(port) + 1);
    } else {
      console.error('[Mock Server Error]:', err);
    }
  });
}

createServer(DEFAULT_PORT);
