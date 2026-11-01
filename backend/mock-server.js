// Server Mock API độc lập cho Smart Classroom Management System
// Chạy bằng: node mock-server.js
const http = require('http');

const DEFAULT_PORT = process.env.PORT || 3000;

// Token Generator chuẩn JWT
function generateMockToken(user) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.username,
    id: user.id || 1,
    code: user.code || 'GV-001',
    fullName: user.fullName || 'Người dùng',
    role: user.role || 'LECTURER',
    email: user.email || `${user.username}@smartclass.edu.vn`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };

  const toBase64Url = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  return `${toBase64Url(header)}.${toBase64Url(payload)}.mock_signature_smart_classroom_jwt_secret_token_2026`;
}

// Dữ liệu mẫu người dùng
const adminUser = {
  id: 99,
  code: 'AD-001',
  username: 'admin',
  fullName: 'Quản trị viên hệ thống',
  email: 'admin@smartclass.edu.vn',
  role: 'ADMIN',
};

const lecturerUser = {
  id: 1,
  code: 'GV-001',
  username: 'gv_nguyenan',
  fullName: 'TS. Nguyễn Văn An',
  email: 'nguyenvanan@smartclass.edu.vn',
  role: 'LECTURER',
  department: 'Khoa Công nghệ Thông tin',
};

const mockLecturersList = [
  { id: 1, username: 'gv_nguyenan', fullName: 'TS. Nguyễn Văn An', role: 'LECTURER' },
  { id: 2, username: 'gv_lethanh', fullName: 'ThS. Lê Thành', role: 'LECTURER' },
  { id: 3, username: 'gv_tranthu', fullName: 'ThS. Trần Thị Thu', role: 'LECTURER' },
];

// Dữ liệu mẫu môn học
let mockCourses = [
  {
    id: 1,
    code: 'INT3105',
    name: 'Lập trình Web Nâng cao',
    room: 'Phòng 402 - Tòa A2',
    schedule: 'Thứ 2 (07:00 - 09:30)',
    studentsCount: 4,
    status: 'Đang diễn ra',
    lecturer_id: 1,
    lecturerId: 1,
    lecturer_username: 'gv_nguyenan',
  },
  {
    id: 2,
    code: 'INT2204',
    name: 'Cấu trúc Dữ liệu & Giải thuật',
    room: 'Phòng 201 - Tòa B1',
    schedule: 'Thứ 4 (13:00 - 15:30)',
    studentsCount: 3,
    status: 'Sắp tới',
    lecturer_id: 2,
    lecturerId: 2,
    lecturer_username: 'gv_lethanh',
  },
  {
    id: 3,
    code: 'INT3306',
    name: 'Phát triển Ứng dụng Di động',
    room: 'Lab 3 - Tòa C',
    schedule: 'Thứ 6 (09:45 - 12:15)',
    studentsCount: 2,
    status: 'Sắp tới',
    lecturer_id: null,
    lecturerId: null,
    lecturer_username: null,
  },
  {
    id: 4,
    code: 'INT3202',
    name: 'Kiến trúc & Thiết kế Phần mềm',
    room: 'Phòng 305 - Tòa B2',
    schedule: 'Thứ 3 (13:00 - 15:30)',
    studentsCount: 2,
    status: 'Sắp tới',
    lecturer_id: 3,
    lecturerId: 3,
    lecturer_username: 'gv_tranthu',
  },
];

// Dữ liệu mẫu sinh viên theo lớp
const mockCourseStudents = {
  1: [
    { id: 'ST001', username: '21020001', fullName: 'Nguyễn Văn An', email: 'an.nv21@vnu.edu.vn', status: 'Đang học', attendanceRate: '95%' },
    { id: 'ST002', username: '21020002', fullName: 'Trần Thị Mai Lan', email: 'lan.ttm21@vnu.edu.vn', status: 'Đang học', attendanceRate: '100%' },
    { id: 'ST003', username: '21020003', fullName: 'Lê Hoàng Nam', email: 'nam.lh21@vnu.edu.vn', status: 'Đang học', attendanceRate: '88%' },
    { id: 'ST004', username: '21020004', fullName: 'Phạm Quỳnh Nga', email: 'nga.pq21@vnu.edu.vn', status: 'Đang học', attendanceRate: '92%' },
  ],
  2: [
    { id: 'ST005', username: '21020015', fullName: 'Vũ Minh Đức', email: 'duc.vm21@vnu.edu.vn', status: 'Đang học', attendanceRate: '90%' },
  ],
  3: [],
  4: [],
};

function createServer(port) {
  const server = http.createServer((req, res) => {
    const url = req.url ? req.url.split('?')[0] : '';

    // Cấu hình CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // 1. Mock API POST /api/auth/login
    if (url === '/api/auth/login' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', (chunk) => { bodyStr += chunk; });
      req.on('end', () => {
        try {
          const body = bodyStr ? JSON.parse(bodyStr) : {};
          const { username, password } = body;

          let authenticatedUser = null;

          if (username === 'admin' && (password === '1234567890' || password === 'adminpassword123' || password === 'admin')) {
            authenticatedUser = { ...adminUser };
          } else if (username === 'gv_nguyenan' && (password === '123456' || password === 'gv_nguyenan')) {
            authenticatedUser = { ...lecturerUser };
          } else if (username === 'tranthuntat1708@gmail.com' && (password === '123456' || password === '1234567890')) {
            authenticatedUser = {
              id: 3,
              code: 'GV-003',
              username: 'tranthuntat1708@gmail.com',
              fullName: 'ThS. Trần Thị Thu',
              email: 'tranthuntat1708@gmail.com',
              role: 'LECTURER',
            };
          } else if (username && password && username !== 'error' && password !== 'wrong') {
            const isAdmin = username.toLowerCase().includes('admin');
            authenticatedUser = {
              id: Math.floor(10 + Math.random() * 90),
              code: isAdmin ? 'AD-999' : 'GV-999',
              username,
              fullName: isAdmin ? `Quản trị viên ${username}` : `Giảng viên ${username}`,
              email: `${username}@smartclass.edu.vn`,
              role: isAdmin ? 'ADMIN' : 'LECTURER',
            };
          } else {
            console.warn(`[Mock Server] [401 Unauthorized] Đăng nhập thất bại: username="${username}"`);
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' }));
            return;
          }

          const token = generateMockToken(authenticatedUser);
          console.log(`[Mock Server] [200 OK] Đăng nhập thành công: ${authenticatedUser.fullName} (Role: ${authenticatedUser.role})`);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              success: true,
              message: 'Đăng nhập thành công',
              token,
              accessToken: token,
              user: authenticatedUser,
              data: {
                token,
                accessToken: token,
                user: authenticatedUser,
              },
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

    // 2. Mock API GET /api/auth/me
    if (url === '/api/auth/me' && req.method === 'GET') {
      const authHeader = req.headers['authorization'] || '';
      let user = { ...lecturerUser };

      try {
        const parts = authHeader.replace(/^Bearer\s+/, '').split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.role === 'ADMIN' || payload.sub === 'admin') {
            user = { ...adminUser };
          } else if (payload.sub) {
            user = {
              ...lecturerUser,
              id: payload.id || lecturerUser.id,
              username: payload.sub,
              fullName: payload.fullName || lecturerUser.fullName,
              role: payload.role || 'LECTURER',
            };
          }
        }
      } catch (err) {
        console.error('Error parsing token:', err);
      }

      console.log(`[Mock Server] [200 OK] GET /api/auth/me: ${user.fullName} (${user.role})`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: true, user, data: { user } }));
      return;
    }

    // 3. Mock API GET /api/courses
    if (url === '/api/courses' && req.method === 'GET') {
      console.log(`[Mock Server] [200 OK] Lấy danh sách khóa học (${mockCourses.length} khóa học)`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          success: true,
          courses: mockCourses,
          data: { courses: mockCourses },
        })
      );
      return;
    }

    // 4. Mock API POST /api/courses (Tạo lớp học mới)
    if (url === '/api/courses' && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', (chunk) => { bodyStr += chunk; });
      req.on('end', () => {
        try {
          const body = bodyStr ? JSON.parse(bodyStr) : {};
          if (!body.code || !body.name) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: 'Mã lớp và tên môn học không được để trống.' }));
            return;
          }

          const newId = mockCourses.length > 0 ? Math.max(...mockCourses.map((c) => Number(c.id) || 0)) + 1 : 1;
          const lecturerId = body.lecturerId ? Number(body.lecturerId) : (body.lecturer_id ? Number(body.lecturer_id) : null);
          const foundLecturer = lecturerId ? mockLecturersList.find((l) => l.id === lecturerId) : null;

          const newCourse = {
            id: newId,
            code: body.code.trim().toUpperCase(),
            name: body.name.trim(),
            room: body.room?.trim() || 'Chưa xếp phòng',
            schedule: body.schedule?.trim() || 'Chưa xếp lịch',
            studentsCount: 0,
            status: 'Mới tạo',
            lecturer_id: lecturerId,
            lecturerId: lecturerId,
            lecturer_username: foundLecturer ? foundLecturer.username : null,
          };

          mockCourses.unshift(newCourse);
          mockCourseStudents[newId] = [];

          console.log(`[Mock Server] [201 Created] Tạo lớp học: ${newCourse.name} (${newCourse.code})`);
          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: true, message: 'Tạo lớp học mới thành công!', course: newCourse, data: { course: newCourse } }));
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, message: 'Body JSON không hợp lệ' }));
        }
      });
      return;
    }

    // 5. Mock API GET /api/users?role=LECTURER (Lấy danh sách giảng viên)
    if (url === '/api/users' && req.method === 'GET') {
      console.log(`[Mock Server] [200 OK] Lấy danh sách giảng viên (${mockLecturersList.length} giảng viên)`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: true, users: mockLecturersList, data: { users: mockLecturersList } }));
      return;
    }

    // 6. Mock API PATCH /api/courses/:id (Phân công lại giảng viên - T018 ADMIN)
    const matchPatchCourse = url.match(/^\/api\/courses\/([^/]+)\/?$/);
    if (matchPatchCourse && req.method === 'PATCH') {
      const courseId = matchPatchCourse[1];
      let bodyStr = '';
      req.on('data', (chunk) => { bodyStr += chunk; });
      req.on('end', () => {
        try {
          const body = bodyStr ? JSON.parse(bodyStr) : {};
          const course = mockCourses.find((c) => String(c.id) === String(courseId));
          if (course) {
            const rawId = body.lecturerId !== undefined ? body.lecturerId : body.lecturer_id;
            const lecturerId = rawId ? Number(rawId) : null;
            course.lecturer_id = lecturerId;
            course.lecturerId = lecturerId;
            const found = lecturerId ? mockLecturersList.find((l) => l.id === lecturerId) : null;
            course.lecturer_username = found ? found.username : null;
          }
          console.log(`[Mock Server] [200 OK] Phân công lại giảng viên lớp ${courseId}: lecturerId=${body.lecturerId}`);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: true, message: 'Cập nhật phân công giảng viên thành công!', course, data: { course } }));
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // 7. Mock API DELETE /api/courses/:id (Xóa khóa học - T018 ADMIN)
    const matchDeleteCourse = url.match(/^\/api\/courses\/([^/]+)\/?$/);
    if (matchDeleteCourse && req.method === 'DELETE') {
      const courseId = matchDeleteCourse[1];
      const idx = mockCourses.findIndex((c) => String(c.id) === String(courseId));
      if (idx !== -1) {
        mockCourses.splice(idx, 1);
      }
      console.log(`[Mock Server] [200 OK] Xóa lớp học phần: id=${courseId}`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: true, message: 'Xóa lớp học phần thành công!' }));
      return;
    }

    // 8. Mock API GET /api/courses/:id/students
    const matchGetStudents = url.match(/^\/api\/courses\/([^/]+)\/students\/?$/);
    if (matchGetStudents && req.method === 'GET') {
      const courseId = matchGetStudents[1];
      const students = mockCourseStudents[courseId] || [];
      console.log(`[Mock Server] [200 OK] Lấy danh sách sinh viên lớp ${courseId} (${students.length} sinh viên)`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: true, students, data: { students } }));
      return;
    }

    // 9. Mock API POST /api/courses/:id/students
    const matchPostStudents = url.match(/^\/api\/courses\/([^/]+)\/students\/?$/);
    if (matchPostStudents && req.method === 'POST') {
      const courseId = matchPostStudents[1];
      let bodyStr = '';
      req.on('data', (chunk) => { bodyStr += chunk; });
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

          const course = mockCourses.find((c) => String(c.id) === String(courseId));
          if (course) {
            course.studentsCount = existingList.length;
          }

          console.log(`[Mock Server] [200 OK] Đã thêm ${addedStudents.length} sinh viên vào lớp ${courseId}`);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: true, message: `Đã thêm ${addedStudents.length} sinh viên thành công`, students: existingList, data: existingList }));
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
        }
      });
      return;
    }

    // 10. Mock API DELETE /api/courses/:id/students/:studentId
    const matchDeleteStudent = url.match(/^\/api\/courses\/([^/]+)\/students\/([^/]+)\/?$/);
    if (matchDeleteStudent && req.method === 'DELETE') {
      const courseId = matchDeleteStudent[1];
      const studentId = matchDeleteStudent[2];

      if (mockCourseStudents[courseId]) {
        mockCourseStudents[courseId] = mockCourseStudents[courseId].filter(
          (s) => s.id !== studentId && s.username !== studentId
        );
        const course = mockCourses.find((c) => String(c.id) === String(courseId));
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

    // 11. Mock API POST /api/auth/logout
    if (url === '/api/auth/logout' && req.method === 'POST') {
      console.log(`[Mock Server] [200 OK] Đăng xuất thành công`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: true, message: 'Đăng xuất thành công' }));
      return;
    }

    // Route không tồn tại
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success: false, message: `Route ${req.method} ${url} không tồn tại trên Mock Server.` }));
  });

  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Smart Classroom Mock API Server đang chạy tại:`);
    console.log(`   👉 http://localhost:${port}`);
    console.log(`------------------------------------------------------`);
    console.log(`📌 Các API hỗ trợ chính:`);
    console.log(`   - POST   http://localhost:${port}/api/auth/login`);
    console.log(`   - GET    http://localhost:${port}/api/auth/me`);
    console.log(`   - GET    http://localhost:${port}/api/courses`);
    console.log(`   - POST   http://localhost:${port}/api/courses`);
    console.log(`   - PATCH  http://localhost:${port}/api/courses/:id`);
    console.log(`   - DELETE http://localhost:${port}/api/courses/:id`);
    console.log(`   - GET    http://localhost:${port}/api/users?role=LECTURER`);
    console.log(`   - GET    http://localhost:${port}/api/courses/:id/students`);
    console.log(`   - POST   http://localhost:${port}/api/courses/:id/students`);
    console.log(`   - DELETE http://localhost:${port}/api/courses/:id/students/:studentId`);
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

