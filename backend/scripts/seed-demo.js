/**
 * Script nạp dữ liệu mẫu (Seed Demo Data) cho dự án Smart Classroom.
 * Dữ liệu bao gồm:
 *  - Giảng viên: gv01 (ThS. Trần Thị Thu), 221b290065 (Giảng viên Trần Văn Cường)
 *  - Sinh viên: 221a010295 (Phạm Hoàng Bảo), 221a290065 (Trần Văn Cường), sv01 (Nguyễn Văn An), sv02 (Lê Thị Bình)
 *  - Môn học: INT20002 (Lập trình Web), INT20003 (Cơ sở dữ liệu)
 *  - Ghi danh sinh viên vào các môn học.
 *
 * Mật khẩu mặc định cho tất cả tài khoản mẫu: 123456
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('../src/config/database');
const authService = require('../src/services/auth.service');
const courseModel = require('../src/models/course.model');
const enrollmentModel = require('../src/models/enrollment.model');
const userModel = require('../src/models/user.model');
const ROLES = require('../src/constants/roles');

const DEFAULT_PASSWORD = '123456';

const DEMO_USERS = [
  // Giảng viên
  {
    username: 'gv01',
    password: DEFAULT_PASSWORD,
    role: ROLES.LECTURER,
    fullName: 'ThS. Trần Thị Thu',
    email: 'tranthu@gmail.com',
  },
  {
    username: '221b290065',
    password: DEFAULT_PASSWORD,
    role: ROLES.LECTURER,
    fullName: 'Giảng viên Trần Văn Cường',
    email: 'cuongtran190404@gmail.com',
  },
  // Sinh viên
  {
    username: '221a010295',
    password: DEFAULT_PASSWORD,
    role: ROLES.STUDENT,
    fullName: 'Phạm Hoàng Bảo',
    email: 'phamhoangbao580@gmail.com',
  },
  {
    username: '221a290065',
    password: DEFAULT_PASSWORD,
    role: ROLES.STUDENT,
    fullName: 'Trần Văn Cường',
    email: 'cuongtran.sv@gmail.com',
  },
  {
    username: 'sv01',
    password: DEFAULT_PASSWORD,
    role: ROLES.STUDENT,
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@student.edu.vn',
  },
  {
    username: 'sv02',
    password: DEFAULT_PASSWORD,
    role: ROLES.STUDENT,
    fullName: 'Lê Thị Bình',
    email: 'binh.le@student.edu.vn',
  },
];

const seedDemo = async () => {
  console.log('🚀 Bắt đầu nạp dữ liệu mẫu lên Database...');

  const createdUserMap = {};

  for (const u of DEMO_USERS) {
    try {
      const user = await authService.createAccount(u);
      createdUserMap[u.username] = user;
      console.log(`✅ Tạo tài khoản [${u.role}]: "${u.username}" - ${u.fullName}`);
    } catch (err) {
      if (err.statusCode === 409) {
        const existing = await userModel.findByUsername(u.username);
        createdUserMap[u.username] = existing;
        console.log(`ℹ️  Tài khoản "${u.username}" đã tồn tại. Bỏ qua.`);
      } else {
        console.error(`❌ Lỗi tạo user ${u.username}:`, err.message);
      }
    }
  }

  // 2. Tạo môn học mẫu
  const coursesToCreate = [
    {
      code: 'INT20002',
      name: 'Lập trình Web Cơ bản',
      lecturerUsername: '221b290065',
      totalSessions: 10,
      maxAbsences: 2,
    },
    {
      code: 'INT20003',
      name: 'Cơ sở Dữ liệu Nâng cao',
      lecturerUsername: 'gv01',
      totalSessions: 12,
      maxAbsences: 3,
    },
  ];

  const studentUsernames = ['221a010295', '221a290065', 'sv01', 'sv02'];

  for (const c of coursesToCreate) {
    const lecturer = createdUserMap[c.lecturerUsername] || await userModel.findByUsername(c.lecturerUsername);
    if (!lecturer) {
      console.warn(`⚠️ Không tìm thấy giảng viên ${c.lecturerUsername} cho môn ${c.code}`);
      continue;
    }

    try {
      let courseId;
      const { rows } = await pool.query('SELECT id FROM courses WHERE code = $1', [c.code]);
      if (rows.length > 0) {
        courseId = rows[0].id;
        console.log(`ℹ️  Môn học "${c.code} - ${c.name}" đã tồn tại (id=${courseId}).`);
      } else {
        courseId = await courseModel.create({
          code: c.code,
          name: c.name,
          lecturerId: lecturer.id,
          totalSessions: c.totalSessions,
          maxAbsences: c.maxAbsences,
        });
        console.log(`✅ Tạo môn học: "${c.code} - ${c.name}" (Giảng viên: ${lecturer.username})`);
      }

      // Ghi danh sinh viên vào môn
      for (const sUsername of studentUsernames) {
        const student = createdUserMap[sUsername] || await userModel.findByUsername(sUsername);
        if (student) {
          try {
            await enrollmentModel.enroll(courseId, student.id);
            console.log(`   + Đã ghi danh SV ${student.username} (${student.full_name}) vào môn ${c.code}`);
          } catch (e) {
            // Đã ghi danh rồi thì bỏ qua
          }
        }
      }
    } catch (err) {
      console.error(`❌ Lỗi tạo môn học ${c.code}:`, err.message);
    }
  }

  console.log('🎉 Hoàn thành nạp dữ liệu mẫu!');
};

seedDemo()
  .catch((err) => {
    console.error('❌ Lỗi seed demo:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
