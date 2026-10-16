import { Buffer } from 'node:buffer';

// Hàm tạo JWT Token chuẩn (RFC 7519) định dạng: header.payload.signature
export function generateMockToken(user) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.username,
    id: user.id || 'GV-2026',
    code: user.code || 'GV-2026',
    fullName: user.fullName || 'TS. Nguyễn Văn An',
    role: user.role || 'Giảng viên',
    email: user.email || `${user.username}@smartclass.edu.vn`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // Hết hạn sau 7 ngày
  };

  const toBase64Url = (obj) => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const headerB64 = toBase64Url(header);
  const payloadB64 = toBase64Url(payload);
  const signature = 'mock_signature_smart_classroom_jwt_secret_token_2026';

  return `${headerB64}.${payloadB64}.${signature}`;
}

export const mockUser = {
  id: 'GV001',
  code: 'GV-2026',
  username: 'gv_nguyenan',
  fullName: 'TS. Nguyễn Văn An',
  email: 'nguyenvanan@smartclass.edu.vn',
  role: 'Giảng viên',
  department: 'Khoa Công nghệ Thông tin',
};

export const mockCourses = [
  {
    id: 'CS101',
    code: 'INT3105',
    name: 'Lập trình Web Nâng cao',
    room: 'Phòng 402 - Tòa A2',
    studentsCount: 4,
    schedule: 'Thứ 2 (07:00 - 09:30)',
    status: 'Đang diễn ra',
  },
  {
    id: 'CS102',
    code: 'INT2204',
    name: 'Cấu trúc Dữ liệu & Giải thuật',
    room: 'Phòng 201 - Tòa B1',
    studentsCount: 3,
    schedule: 'Thứ 4 (13:00 - 15:30)',
    status: 'Sắp tới',
  },
  {
    id: 'CS103',
    code: 'INT3306',
    name: 'Phát triển Ứng dụng Di động',
    room: 'Lab 3 - Tòa C',
    studentsCount: 2,
    schedule: 'Thứ 6 (09:45 - 12:15)',
    status: 'Sắp tới',
  },
  {
    id: 'CS104',
    code: 'INT3202',
    name: 'Kiến trúc & Thiết kế Phần mềm',
    room: 'Phòng 305 - Tòa B2',
    studentsCount: 2,
    schedule: 'Thứ 3 (13:00 - 15:30)',
    status: 'Sắp tới',
  },
];

// Danh sách sinh viên thuộc từng lớp học (GET /api/courses/:id/students)
export const mockCourseStudents = {
  CS101: [
    {
      id: 'ST001',
      username: '21020001',
      fullName: 'Nguyễn Văn An',
      email: 'an.nv21@vnu.edu.vn',
      status: 'Đang học',
      attendanceRate: '95%',
    },
    {
      id: 'ST002',
      username: '21020002',
      fullName: 'Trần Thị Mai Lan',
      email: 'lan.ttm21@vnu.edu.vn',
      status: 'Đang học',
      attendanceRate: '100%',
    },
    {
      id: 'ST003',
      username: '21020003',
      fullName: 'Lê Hoàng Nam',
      email: 'nam.lh21@vnu.edu.vn',
      status: 'Đang học',
      attendanceRate: '88%',
    },
    {
      id: 'ST004',
      username: '21020004',
      fullName: 'Phạm Quỳnh Nga',
      email: 'nga.pq21@vnu.edu.vn',
      status: 'Đang học',
      attendanceRate: '92%',
    },
  ],
  CS102: [
    {
      id: 'ST005',
      username: '21020015',
      fullName: 'Đặng Tuấn Anh',
      email: 'anh.dt21@vnu.edu.vn',
      status: 'Đang học',
      attendanceRate: '90%',
    },
    {
      id: 'ST006',
      username: '21020016',
      fullName: 'Vũ Minh Hằng',
      email: 'hang.vm21@vnu.edu.vn',
      status: 'Đang học',
      attendanceRate: '85%',
    },
    {
      id: 'ST007',
      username: '21020017',
      fullName: 'Trần Quốc Bảo',
      email: 'bao.tq21@vnu.edu.vn',
      status: 'Đang học',
      attendanceRate: '95%',
    },
  ],
  CS103: [
    {
      id: 'ST008',
      username: '21020028',
      fullName: 'Bùi Đức Long',
      email: 'long.bd21@vnu.edu.vn',
      status: 'Đang học',
      attendanceRate: '96%',
    },
    {
      id: 'ST009',
      username: '21020029',
      fullName: 'Hoàng Thùy Dương',
      email: 'duong.ht21@vnu.edu.vn',
      status: 'Đang học',
      attendanceRate: '100%',
    },
  ],
  CS104: [
    {
      id: 'ST010',
      username: '21020035',
      fullName: 'Đỗ Hải Yến',
      email: 'yen.dh21@vnu.edu.vn',
      status: 'Đang học',
      attendanceRate: '100%',
    },
    {
      id: 'ST011',
      username: '21020036',
      fullName: 'Ngô Thanh Tùng',
      email: 'tung.nt21@vnu.edu.vn',
      status: 'Đang học',
      attendanceRate: '91%',
    },
  ],
};
