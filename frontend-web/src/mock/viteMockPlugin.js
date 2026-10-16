import { generateMockToken, mockCourses, mockUser, mockCourseStudents } from './mockData.js';

export function viteMockPlugin() {
  return {
    name: 'vite-mock-api-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // QUAN TRỌNG: Chỉ chặn các request có tiền tố /api/
        // Mọi request UI của React Router (/, /courses, /qr-projector, /statistics, /login,...)
        // được chuyển tiếp 100% cho Vite
        if (!url.startsWith('/api/')) {
          return next();
        }

        // Hỗ trợ CORS
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
                    message: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
                  })
                );
                return;
              }

              const user = {
                ...mockUser,
                username: username || mockUser.username,
                fullName:
                  username === 'gv_nguyenan'
                    ? mockUser.fullName
                    : `Giảng viên ${username}`,
              };
              const token = generateMockToken(user);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(
                JSON.stringify({
                  success: true,
                  message: 'Đăng nhập thành công (Vite Mock Server)',
                  token,
                  user,
                })
              );
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Dữ liệu yêu cầu không hợp lệ.' }));
            }
          });
          return;
        }

        // 2. Mock API GET /api/courses (Lấy danh sách khóa học)
        if (url === '/api/courses' && req.method === 'GET') {
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
                res.end(
                  JSON.stringify({
                    success: false,
                    message: 'Mã lớp và tên môn học không được để trống.',
                  })
                );
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

              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(
                JSON.stringify({
                  success: true,
                  message: 'Tạo lớp học mới thành công!',
                  data: newCourse,
                })
              );
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ.' }));
            }
          });
          return;
        }

        // 4. Mock API GET /api/courses/:id/students (Lấy danh sách sinh viên)
        const matchGetStudents = url.match(/^\/api\/courses\/([^/]+)\/students\/?$/);
        if (matchGetStudents && req.method === 'GET') {
          const courseId = matchGetStudents[1];
          const students = mockCourseStudents[courseId] || [];

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              success: true,
              data: students,
            })
          );
          return;
        }

        // 5. Mock API POST /api/courses/:id/students (Thêm sinh viên vào lớp học)
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
              // Nhận mảng usernames hoặc chuỗi phân tách bởi dấu phẩy/xuống dòng
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
                res.end(
                  JSON.stringify({
                    success: false,
                    message: 'Vui lòng nhập ít nhất một mã sinh viên/username.',
                  })
                );
                return;
              }

              if (!mockCourseStudents[courseId]) {
                mockCourseStudents[courseId] = [];
              }

              const existingList = mockCourseStudents[courseId];
              const addedStudents = [];

              usernames.forEach((u) => {
                const cleanUser = u.trim();
                // Tránh thêm trùng
                const isExist = existingList.some((s) => s.username === cleanUser);
                if (!isExist) {
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

              // Cập nhật studentsCount của khóa học
              const course = mockCourses.find((c) => c.id === courseId);
              if (course) {
                course.studentsCount = existingList.length;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(
                JSON.stringify({
                  success: true,
                  message: `Thêm thành công ${addedStudents.length} sinh viên vào lớp học.`,
                  data: existingList,
                })
              );
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ.' }));
            }
          });
          return;
        }

        // 6. Mock API DELETE /api/courses/:id/students/:studentId (Xóa sinh viên khỏi lớp)
        const matchDeleteStudent = url.match(/^\/api\/courses\/([^/]+)\/students\/([^/]+)\/?$/);
        if (matchDeleteStudent && req.method === 'DELETE') {
          const courseId = matchDeleteStudent[1];
          const studentId = matchDeleteStudent[2];

          if (mockCourseStudents[courseId]) {
            mockCourseStudents[courseId] = mockCourseStudents[courseId].filter(
              (s) => s.id !== studentId && s.username !== studentId
            );

            // Cập nhật studentsCount của khóa học
            const course = mockCourses.find((c) => c.id === courseId);
            if (course) {
              course.studentsCount = mockCourseStudents[courseId].length;
            }
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              success: true,
              message: 'Đã xóa sinh viên khỏi lớp học thành công.',
            })
          );
          return;
        }

        // 7. Mock API POST /api/auth/logout
        if (url === '/api/auth/logout' && req.method === 'POST') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              success: true,
              message: 'Đăng xuất thành công',
            })
          );
          return;
        }

        // ============================================================
        // 8. Mock API POST /api/courses/:id/sessions (T011 - Tạo phiên điểm danh)
        // ============================================================
        const matchCreateSession = url.match(/^\/api\/courses\/([^/]+)\/sessions\/?$/);
        if (matchCreateSession && req.method === 'POST') {
          const courseId = matchCreateSession[1];
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', () => {
            try {
              const body = bodyStr ? JSON.parse(bodyStr) : {};
              const sessionId = `SESSION-${courseId}-${Date.now()}`;
              const session = {
                id: sessionId,
                courseId,
                duration: body.duration || 45,
                latitude: body.latitude || null,
                longitude: body.longitude || null,
                status: 'active',
                createdAt: new Date().toISOString(),
              };
              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, data: session }));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ.' }));
            }
          });
          return;
        }

        // ============================================================
        // 9. Mock API POST /api/sessions/:id/close (T011 - Đóng phiên)
        // ============================================================
        const matchCloseSession = url.match(/^\/api\/sessions\/([^/]+)\/close\/?$/);
        if (matchCloseSession && req.method === 'POST') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: true, message: 'Phiên điểm danh đã được đóng.' }));
          return;
        }

        // ============================================================
        // 10. Mock API GET /api/reports/courses/:id (T012 - Báo cáo chuyên cần)
        // ============================================================
        const mockReportData = {
          CS101: {
            courseName: 'Lập trình Web Nâng cao',
            courseCode: 'INT3105',
            totalSessions: 14,
            students: [
              { mssv: '21020001', fullName: 'Nguyễn Văn An',      present: 13, late: 1, absent: 0 },
              { mssv: '21020002', fullName: 'Trần Thị Mai Lan',   present: 14, late: 0, absent: 0 },
              { mssv: '21020003', fullName: 'Lê Hoàng Nam',       present: 11, late: 1, absent: 2 },
              { mssv: '21020004', fullName: 'Phạm Quỳnh Nga',     present: 12, late: 2, absent: 0 },
            ],
          },
          CS102: {
            courseName: 'Cấu trúc Dữ liệu & Giải thuật',
            courseCode: 'INT2204',
            totalSessions: 12,
            students: [
              { mssv: '21020015', fullName: 'Đặng Tuấn Anh',     present: 10, late: 1, absent: 1 },
              { mssv: '21020016', fullName: 'Vũ Minh Hằng',      present: 9,  late: 0, absent: 3 },
              { mssv: '21020017', fullName: 'Trần Quốc Bảo',     present: 12, late: 0, absent: 0 },
            ],
          },
          CS103: {
            courseName: 'Phát triển Ứng dụng Di động',
            courseCode: 'INT3306',
            totalSessions: 10,
            students: [
              { mssv: '21020028', fullName: 'Bùi Đức Long',      present: 10, late: 0, absent: 0 },
              { mssv: '21020029', fullName: 'Hoàng Thùy Dương',  present: 10, late: 0, absent: 0 },
            ],
          },
        };

        const matchGetReport = url.match(/^\/api\/reports\/courses\/([^/]+)\/?$/);
        if (matchGetReport && req.method === 'GET') {
          const courseId = matchGetReport[1];
          const report = mockReportData[courseId];
          if (!report) {
            // Tìm trong mockCourses và tạo report rỗng
            const course = mockCourses.find((c) => c.id === courseId);
            if (!course) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Không tìm thấy lớp học này.' }));
              return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              success: true,
              data: {
                courseName: course.name,
                courseCode: course.code,
                totalSessions: 0,
                students: mockCourseStudents[courseId] || [],
              },
            }));
            return;
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: true, data: report }));
          return;
        }

        // ============================================================
        // 11. Mock API GET /api/reports/courses/:id/export (T012 - Xuất CSV)
        // ============================================================
        const matchExportReport = url.match(/^\/api\/reports\/courses\/([^/]+)\/export\/?$/);
        if (matchExportReport && req.method === 'GET') {
          const courseId = matchExportReport[1];
          const report = mockReportData[courseId];
          if (!report) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: 'Không có dữ liệu để xuất.' }));
            return;
          }
          // Tạo CSV UTF-8 BOM
          const BOM = '\uFEFF';
          const headers = ['#', 'MSSV', 'Họ và Tên Sinh Viên', 'Số buổi Có mặt', 'Số buổi Đi muộn', 'Số buổi Vắng mặt', 'Tỷ lệ chuyên cần (%)'];
          const rows = [
            [`Báo cáo chuyên cần - ${report.courseName} (${report.courseCode})`],
            [`Tổng số buổi học: ${report.totalSessions}`],
            [`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
            [],
            headers,
            ...report.students.map((st, idx) => {
              const rate = Math.round(((st.present + st.late * 0.5) / report.totalSessions) * 100);
              return [idx + 1, st.mssv, st.fullName, st.present, st.late, st.absent, `${rate}%`];
            }),
          ];
          const csvBody = rows
            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
            .join('\r\n');
          const csv = BOM + csvBody;

          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="bao_cao_${report.courseCode}.csv"`);
          res.end(csv);
          return;
        }

        // Không tìm thấy endpoint API
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            success: false,
            message: `Mock API không hỗ trợ endpoint: ${req.method} ${url}`,
          })
        );
      });
    },
  };
}
