# README_T019 — Backend Nâng Cấp: Quản Trị Người Dùng, Device Binding, Đơn Nghỉ Phép & Cảnh Báo Cấm Thi

## 1. Bảng Thông Tin

| Thuộc tính | Chi tiết |
|---|---|
| **Task ID** | T019 |
| **Stream** | Backend / Database / Business Logic |
| **Epic** | Quản trị Hệ thống, Chống Gian lận Thiết bị & Quản lý Nghỉ phép |
| **Người phụ trách** | Cường (Backend Lead) |
| **Trạng thái** | ✅ Hoàn thành (10/10 Test Suites Passed) |
| **Definition of Done** | - Migration CSDL bổ sung cột và bảng mới an toàn, có up/down.<br>- API Quản trị tài khoản (CRUD, CSV Import, Reset Password, Unbind Device, Lock/Unlock).<br>- Điểm danh bắt buộc Device Binding: tự liên kết lần đầu, từ chối khi dùng thiết bị khác.<br>- Module Đơn xin nghỉ phép trực tuyến: SV nộp đơn, GV duyệt/từ chối, đồng bộ `EXCUSED` vào điểm danh.<br>- Báo cáo môn học tích hợp `total_sessions`, `max_absences`, `excused_count`, `is_banned`. |

---

## 2. Mục Tiêu

1. **Quản trị người dùng toàn diện:** Cho phép Admin cấp tài khoản (có `full_name`, `email`), import danh sách từ CSV hàng loạt, reset mật khẩu về mặc định (`123456`), khóa/mở khóa tài khoản.
2. **Device Binding (Khóa 1 tài khoản trên 1 thiết bị):** Chống triệt để việc 1 sinh viên mang nhiều điện thoại hộ bạn bè vào lớp quét mã. Mỗi tài khoản chỉ được điểm danh trên đúng thiết bị đã đăng ký; Admin có quyền gỡ liên kết khi SV đổi máy.
3. **Đơn xin nghỉ phép trực tuyến (Absence Request):** Sinh viên nộp đơn kèm lý do và ảnh minh chứng qua Mobile. Giảng viên duyệt đơn trên Web, tự động cập nhật trạng thái `EXCUSED` cho buổi học tương ứng, không bị phạt vắng mặt.
4. **Cấu hình số buổi học & Cảnh báo cấm thi:** Môn học cấu hình `total_sessions` (mặc định 10) và `max_absences` (mặc định 2). Hệ thống tính toán `absent_count` và tự động gắn cờ `is_banned: true` khi số buổi vắng vượt quá quy định.

---

## 3. Những Gì Đã Làm (Files & Modifications)

### A. Database Migration
- [`backend/migrations/sqls/20261106183000-user-mgmt-device-leave-up.sql`](file:///d:/github/Smart-Classroom-Management-System/backend/migrations/sqls/20261106183000-user-mgmt-device-leave-up.sql):
  - Bổ sung vào bảng `users`: `full_name`, `email`, `device_id`, `is_locked`.
  - Bổ sung vào bảng `courses`: `total_sessions` (mặc định 10), `max_absences` (mặc định 2).
  - Bổ sung giá trị `'EXCUSED'` vào ENUM `attendance_status`.
  - Tạo bảng `leave_requests` cùng ENUM `leave_request_status ('PENDING', 'APPROVED', 'REJECTED')` và các index tối ưu hóa.
- [`backend/migrations/sqls/20261106183000-user-mgmt-device-leave-down.sql`](file:///d:/github/Smart-Classroom-Management-System/backend/migrations/sqls/20261106183000-user-mgmt-device-leave-down.sql): Revert an toàn.
- [`backend/migrations/20261106183000-user-mgmt-device-leave.js`](file:///d:/github/Smart-Classroom-Management-System/backend/migrations/20261106183000-user-mgmt-device-leave.js): File migration runner cho `db-migrate`.

### B. User Management & Device Binding
- [`backend/src/models/user.model.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/models/user.model.js):
  - Mở rộng `PUBLIC_COLUMNS` gồm `full_name, email, device_id, is_locked`.
  - Thêm phương thức `update`, `resetPassword`, `unbindDevice`, `setLockStatus`.
  - Tối ưu `findAll` hỗ trợ tìm kiếm trên cả `username`, `full_name`, `email`.
- [`backend/src/services/user.service.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/services/user.service.js):
  - `createUser`: Admin tạo tài khoản có họ tên và email.
  - `resetPassword`: Admin đặt lại mật khẩu về mặc định (hoặc tùy chọn).
  - `unbindDevice`: Gỡ `device_id` về `null`.
  - `toggleLock`: Khóa/mở khóa tài khoản (ngăn admin tự khóa chính mình).
  - `importUsersCsv`: Xử lý import CSV thông minh, hỗ trợ đa dạng tên cột tiếng Việt/Anh, bỏ qua lỗi dòng hỏng mà không làm đứt chuỗi import.
- [`backend/src/services/auth.service.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/services/auth.service.js):
  - Kiểm tra `is_locked` khi đăng nhập, từ chối tài khoản bị khóa với mã 403.
- [`backend/src/services/attendance.service.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/services/attendance.service.js):
  - Tự động lưu `device_id` lần đầu điểm danh.
  - Chặn đứng thiết bị lạ: Nếu `user.device_id !== deviceId`, trả về lỗi 403 Forbidden kèm thông báo hướng dẫn liên hệ Admin.
  - Kiểm tra tài khoản có bị khóa không trước khi ghi nhận điểm danh.

### C. Leave Requests & Academic Warning
- [`backend/src/models/leaveRequest.model.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/models/leaveRequest.model.js):
  - Data access cho đơn nghỉ phép: `create`, `findById`, `findAll`, `review`, `findSessionForCourseAndDate`, `upsertExcusedAttendance`, `revertExcusedAttendance`.
- [`backend/src/services/leaveRequest.service.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/services/leaveRequest.service.js):
  - `submitRequest`: Kiểm tra SV có đăng ký môn, tìm session khớp ngày hoặc nhận session chỉ định.
  - `getLeaveRequests`: Phân quyền (SV xem đơn mình, GV xem đơn lớp mình, Admin xem tất cả).
  - `reviewLeaveRequest`: Khi DUYỆT (APPROVED) -> tự động upsert vào `attendance_records` trạng thái `EXCUSED`. Khi TỪ CHỐI -> gỡ bỏ bản ghi EXCUSED.
- [`backend/src/models/course.model.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/models/course.model.js):
  - Lưu và trả về `total_sessions`, `max_absences`.
- [`backend/src/models/report.model.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/models/report.model.js) & [`backend/src/services/report.service.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/services/report.service.js):
  - Thống kê đầy đủ: `present_count`, `late_count`, `excused_count`, `invalid_count`, `absent_count`, `held_sessions`, `total_sessions`, `max_absences`.
  - Tự động gắn cờ `is_banned: true` khi `absent_count > max_absences`.
  - Báo cáo CSV bổ sung cột thông tin sinh viên, số buổi nghỉ phép và tình trạng cấm thi.

### D. Routes & App Configuration
- [`backend/src/routes/user.routes.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/routes/user.routes.js) & [`backend/src/routes/leaveRequest.routes.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/routes/leaveRequest.routes.js).
- [`backend/src/routes/index.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/routes/index.js): Đăng ký `/api/leave-requests`.
- [`backend/src/app.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/app.js): Nâng giới hạn payload lên `10mb` (hỗ trợ ảnh minh chứng đơn nghỉ phép và danh sách CSV lớn), bổ sung method `PATCH` trong CORS.

---

## 4. Danh Sách API Mới / Nâng Cấp

### 4.1. Quản trị Người Dùng (Admin Only)
| Endpoint | Method | Quyền | Mô tả |
|---|---|---|---|
| `/api/users` | `GET` | Admin / GV | Lấy danh sách users (hỗ trợ `?role=...&search=...`) |
| `/api/users` | `POST` | Admin | Tạo tài khoản đơn lẻ kèm `full_name`, `email` |
| `/api/users/import-csv` | `POST` | Admin | Import tài khoản hàng loạt từ file CSV hoặc JSON |
| `/api/users/:id/reset-password` | `POST` | Admin | Đặt lại mật khẩu về mặc định `123456` |
| `/api/users/:id/unbind-device` | `POST` | Admin | Gỡ liên kết thiết bị đã khóa (cho phép đổi máy) |
| `/api/users/:id/toggle-lock` | `PATCH` | Admin | Khóa / mở khóa tài khoản |
| `/api/users/:id` | `PATCH` | Admin | Cập nhật thông tin tài khoản |

### 4.2. Điểm danh Chống Gian lận (Device Binding)
| Endpoint | Method | Quyền | Mô tả |
|---|---|---|---|
| `/api/attendance/checkin` | `POST` | Student | Gửi `{ token, latitude, longitude, deviceId, ip_address? }`. Tự động khóa thiết bị lần đầu, từ chối thiết bị lạ (403) |

### 4.3. Đơn Xin Nghỉ Phép Trực Tuyến
| Endpoint | Method | Quyền | Mô tả |
|---|---|---|---|
| `/api/leave-requests` | `POST` | Student | Gửi đơn `{ courseId, requestedDate, reason, proofImageUrl? }` |
| `/api/leave-requests` | `GET` | All | Lấy danh sách đơn (phân quyền tự động theo role) |
| `/api/leave-requests/course/:courseId` | `GET` | Admin / GV | Lấy danh sách đơn của 1 lớp học phần |
| `/api/leave-requests/:id` | `GET` | All | Lấy chi tiết đơn xin nghỉ |
| `/api/leave-requests/:id` | `PATCH` | Admin / GV | Duyệt (`APPROVED`) hoặc từ chối (`REJECTED`) kèm `reviewNote` |

### 4.4. Cấu hình Lớp & Cảnh báo Cấm thi
| Endpoint | Method | Quyền | Mô tả |
|---|---|---|---|
| `/api/courses` | `POST` | Admin / GV | Tạo lớp có `totalSessions` (mặc định 10), `maxAbsences` (mặc định 2) |
| `/api/courses/:id` | `PATCH` | Admin / GV | Cập nhật `totalSessions`, `maxAbsences` |
| `/api/reports/courses/:courseId` | `GET` | Admin / GV | Trả về thống kê `excused_count`, `held_sessions`, `is_banned` |
| `/api/reports/courses/:courseId/export` | `GET` | Admin / GV | Xuất CSV báo cáo điểm danh kèm cột Cấm thi |

---

## 5. Quyết Định Kỹ Thuật

1. **Device Binding tự động (Zero-Friction Onboarding):** Không yêu cầu sinh viên phải đăng ký thiết bị rườm rà trước. Lần đầu tiên sinh viên dùng điện thoại của mình để quét mã thành công, hệ thống tự động ghi nhận UUID thiết bị đó vào DB. Kể từ lần thứ hai, nếu bạn bè đăng nhập tài khoản đó trên máy khác để quét hộ, backend lập tức từ chối với lỗi 403.
2. **Đồng bộ Đơn nghỉ phép & Điểm danh (`EXCUSED`):** Khi giảng viên bấm "Duyệt", backend tự động tìm buổi học trùng ngày diễn ra (nếu có) và ghi nhận bản ghi điểm danh với trạng thái `EXCUSED`. Nhờ đó, số buổi vắng không phép (`absent_count`) không bị tăng lên, bảo vệ quyền lợi chuyên cần của sinh viên.
3. **Báo cáo Cấm thi tức thời (Realtime Academic Warning):** `is_banned` được tính toán trực tiếp ngay trong câu query SQL bằng biểu thức `absent_count > course.max_absences`. Không cần chạy cronjob cập nhật ngầm, giảng viên mở bảng báo cáo lúc nào cũng thấy trạng thái chính xác tức thì.
4. **Parser CSV tích hợp không phụ thuộc thư viện ngoài:** Module import người dùng sử dụng parser regex hỗ trợ quote RFC-4180 và tự động phát hiện header tiếng Việt (`mssv`, `ho_ten`, `vai_tro`, `mat_khau`) lẫn tiếng Anh (`username`, `full_name`, `role`, `password`), giảm thiểu lỗi nhập liệu của người dùng.

---

## 6. Kết Quả Kiểm Thử (Integration Test)

Kịch bản kiểm thử toàn diện đã được thực thi tự động qua test suite tích hợp với Database PostgreSQL và Redis thực tế:
- **Test 1:** Admin đăng nhập xác thực thành công.
- **Test 2:** Admin tạo người dùng có `full_name`, `email` hợp lệ.
- **Test 3:** Admin import danh sách sinh viên qua CSV thành công 100%.
- **Test 4:** Admin reset mật khẩu sinh viên, sinh viên đăng nhập thành công bằng mật khẩu mới.
- **Test 5:** Khóa tài khoản -> Sinh viên bị từ chối đăng nhập (403); Mở khóa -> Đăng nhập bình thường.
- **Test 6:** Giảng viên tạo lớp học phần với `total_sessions: 12`, `max_absences: 3`.
- **Test 7:** Sinh viên điểm danh lần 1 trên máy `DEV-PHONE-A` -> Thành công & Tự động bind device. Điểm danh lần 2 trên máy lạ `DEV-PHONE-B` -> Bị từ chối ngay lập tức (403 Device mismatch).
- **Test 8:** Admin gỡ liên kết thiết bị (`unbind-device`) -> Sinh viên dùng máy `DEV-PHONE-B` điểm danh thành công và được liên kết vào máy mới.
- **Test 9:** Sinh viên nộp đơn xin nghỉ phép kèm minh chứng -> Giảng viên xem và bấm duyệt -> Bản ghi điểm danh tự động cập nhật `EXCUSED`.
- **Test 10:** Báo cáo điểm danh và xuất file CSV tính toán chính xác số buổi nghỉ phép, vắng không phép và gắn cờ cấm thi (`is_banned`) chuẩn xác.

---

## 7. Hướng Dẫn Các Thành Viên Tiếp Theo

### Cho Thư (Frontend Web - Task T020):
- Menu **Quản lý người dùng** trên Sidebar Admin đã sẵn sàng đón nhận các API:
  - Danh sách & Bộ lọc: `GET /api/users?role=...&search=...`
  - Thêm tài khoản: `POST /api/users`
  - Import CSV: `POST /api/users/import-csv`
  - Reset pass / Unbind device / Khóa: `POST /api/users/:id/reset-password`, `POST /api/users/:id/unbind-device`, `PATCH /api/users/:id/toggle-lock`.
- Giảng viên tạo phiên điểm danh: Màn hình mở phiên không cần bắt nhập toạ độ thủ công, Frontend chỉ cần gọi `navigator.geolocation.getCurrentPosition()` lấy lat/lng và truyền vào `POST /api/courses/:id/sessions`.
- Danh sách đơn xin nghỉ phép: Gọi `GET /api/leave-requests/course/:courseId` và `PATCH /api/leave-requests/:id`.

### Cho Bảo (Mobile - Task T021):
- Khi gọi `POST /api/attendance/checkin`, bắt buộc gửi thêm `deviceId` (dùng `expo-application` hoặc `react-native-device-info` lấy Unique ID thiết bị).
- Màn hình nộp đơn xin nghỉ phép: Gửi `POST /api/leave-requests` với `{ courseId, requestedDate, reason, proofImageUrl }`.
