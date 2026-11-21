# README_T020 — Frontend Web: Quản Trị Người Dùng, Duyệt Đơn Nghỉ Phép, GPS QR Tự Động & Cảnh Báo Cấm Thi

## 1. Bảng Thông Tin

| Thuộc tính | Chi tiết |
|---|---|
| **Task ID** | T020 |
| **Stream** | Frontend Web / Admin & Lecturer Portal / Realtime Check-in |
| **Epic** | Hoàn Thiện Giao Diện Nghiệp Vụ Quản Trị, Nghỉ Phép, QR GPS & Quy Chế Học Vụ |
| **Người phụ trách** | Frontend Team |
| **Trạng thái** | ✅ Hoàn thành (0 error, 0 warning ESLint, Production Build Passed) |
| **Definition of Done** | - Triển khai trang Quản trị người dùng `/users` (CRUD, Import CSV, Reset Password, Unbind Device, Lock/Unlock) với phân quyền `<AdminRoute>`.<br>- Triển khai trang Xét duyệt Đơn nghỉ phép `/leave-requests` (xem ảnh minh chứng phóng to, phê duyệt/từ chối kèm ghi chú).<br>- Tích hợp Geolocation API tự động lấy tọa độ GPS của giảng viên trên `QRProjector.jsx`, loại bỏ hoàn toàn ô nhập tay.<br>- Bảng Thống kê `Statistics.jsx` hiển thị `total_sessions`, `max_absences`, `excused_count` và gắn huy hiệu đỏ **"CẤM THI"** khi `is_banned === true`.<br>- Modal tạo lớp học trong `Courses.jsx` bổ sung cấu hình `totalSessions` và `maxAbsences`. |

---

## 2. Mục Tiêu

1. **Quản trị người dùng toàn diện (`/users`):** Cung cấp giao diện cho Admin cấp tài khoản mới, import danh sách từ file CSV (hỗ trợ cả tiếng Việt lẫn tiếng Anh), đặt lại mật khẩu về `123456`, gỡ liên kết thiết bị đã đăng ký của sinh viên, và khóa/mở khóa tài khoản trực tiếp trên bảng dữ liệu.
2. **Xét duyệt đơn xin nghỉ phép (`/leave-requests`):** Giảng viên phụ trách chọn lớp học phần, duyệt đơn nghỉ phép của sinh viên có kèm lý do và xem ảnh minh chứng phóng to (Modal Image Viewer), nhập ghi chú phản hồi khi duyệt/từ chối.
3. **Mở phiên điểm danh QR bằng GPS tự động (`/qr-projector`):** Thay thế hoàn toàn cơ chế nhập tay kinh độ/vĩ độ bằng `navigator.geolocation.getCurrentPosition()`, tự động phát hiện tọa độ phòng học thực tế, chọn nhanh bán kính cho phép (50m, 100m, 150m, 200m). Dọn dẹp toàn bộ thuật ngữ kỹ thuật lập trình trên giao diện.
4. **Bảng thống kê & Cảnh báo cấm thi (`/statistics`):** Đồng bộ hóa các chỉ số học vụ theo Task T019 của Backend, hiển thị số buổi nghỉ có phép (`excused_count`), tổng số buổi (`total_sessions`), mức vắng tối đa (`max_absences`), gắn huy hiệu đỏ nổi bật **"CẤM THI"** khi sinh viên vi phạm quy chế.
5. **Cấu hình số buổi học khi tạo khóa học (`/courses`):** Giảng viên và Admin có thể tùy biến tổng số buổi học phần và số buổi vắng tối đa cho phép ngay khi tạo lớp mới.

---

## 3. Những Gì Đã Làm (Files & Modifications)

### A. Quản Trị Người Dùng & Phân Quyền
- [`frontend-web/src/pages/Users.jsx`](file:///frontend-web/src/pages/Users.jsx):
  - Trang quản trị tài khoản toàn trường.
  - Bộ lọc 4 tab vai trò (*Tất cả*, *Giảng viên*, *Sinh viên*, *Quản trị viên*) kết hợp ô tìm kiếm real-time có cơ chế debounce 350ms gọi `GET /api/users?role=...&search=...`.
  - Modal "Cấp tài khoản mới" hỗ trợ nhập username, họ tên, email, vai trò (`STUDENT` / `LECTURER`), mật khẩu khởi tạo (mặc định `123456`) gửi `POST /api/users`.
  - Modal "Import CSV" cho phép chọn file `.csv`, preview tên file, có nút tải file mẫu chuẩn `smartclass_users_template.csv` và gửi `POST /api/users/import-csv`.
  - 3 nút hành động nhanh trên từng dòng:
    1. *Reset mật khẩu*: Gọi `POST /api/users/:id/reset-password`.
    2. *Gỡ thiết bị*: Gọi `POST /api/users/:id/unbind-device` (tự động disable khi tài khoản chưa liên kết thiết bị).
    3. *Khóa / Mở khóa*: Gọi `PATCH /api/users/:id/toggle-lock` (chặn không cho Admin tự khóa chính mình).
- [`frontend-web/src/App.jsx`](file:///frontend-web/src/App.jsx):
  - Khai báo component `<AdminRoute>` kiểm tra `user.role === 'ADMIN'`.
  - Đăng ký route `/users` được bảo vệ bằng `<AdminRoute>`.
- [`frontend-web/src/components/Layout.jsx`](file:///frontend-web/src/components/Layout.jsx):
  - Bổ sung menu "Quản lý người dùng" (`/users`) trên Sidebar chỉ hiển thị khi `isAdmin === true`.

### B. Xét Duyệt Đơn Nghỉ Phép
- [`frontend-web/src/pages/LeaveRequests.jsx`](file:///frontend-web/src/pages/LeaveRequests.jsx):
  - Màn hình dành riêng cho giảng viên xét duyệt đơn nghỉ phép của sinh viên.
  - Dropdown chọn lớp học phần (`GET /api/courses`), tự động tải danh sách đơn qua `GET /api/leave-requests/course/:courseId`.
  - Bộ lọc trạng thái đơn (*Tất cả*, *Chờ duyệt*, *Đã duyệt*, *Từ chối*) và tìm kiếm theo tên/MSSV.
  - Xem ảnh minh chứng phóng to: Modal hiển thị ảnh sắc nét, tên sinh viên, ngày xin nghỉ, lý do và nút mở trong tab mới.
  - Duyệt / Từ chối đơn: Ô nhập `reviewNote` tùy chọn, nút "Duyệt" (xanh lá) và "Từ chối" (đỏ) gọi `PATCH /api/leave-requests/:id`.
- [`frontend-web/src/components/Layout.jsx`](file:///frontend-web/src/components/Layout.jsx):
  - Thêm menu "Đơn xin nghỉ phép" (`/leave-requests`) trên Sidebar cho Giảng viên (`!isAdmin`).
- [`frontend-web/src/pages/Courses.jsx`](file:///frontend-web/src/pages/Courses.jsx):
  - Thêm nút liên kết điều hướng nhanh từ chi tiết lớp học sang trang duyệt đơn của lớp: `/leave-requests?courseId=...`.

### C. Mở Phiên QR GPS Tự Động & Dọn Dẹp Giao Diện
- [`frontend-web/src/pages/QRProjector.jsx`](file:///frontend-web/src/pages/QRProjector.jsx):
  - Gỡ bỏ hoàn toàn các ô input bắt giảng viên gõ tay vĩ độ, kinh độ, BSSID Wifi.
  - Tích hợp Geolocation API `navigator.geolocation.getCurrentPosition()`, tự động lấy tọa độ ngay khi mở trang kèm cờ kiểm tra quyền vị trí và nút "Cập nhật lại GPS".
  - Hiển thị tọa độ vĩ độ/kinh độ chính xác cùng sai số thiết bị (±m).
  - Bộ chọn bán kính điểm danh 4 mức: 50m, 100m, 150m, 200m.
  - Chuẩn hóa toàn bộ câu chữ giao diện: loại bỏ các thuật ngữ kỹ thuật nội bộ (`Socket.io`, `Redis`, `attendance_scanned`, `(token) từ máy chủ`), thay bằng ngôn ngữ tự nhiên, thân thiện với người dùng.

### D. Thống Kê & Cảnh Báo Cấm Thi
- [`frontend-web/src/pages/Statistics.jsx`](file:///frontend-web/src/pages/Statistics.jsx):
  - Đọc và hiển thị các trường: `total_sessions` (tổng số buổi học), `max_absences` (số buổi vắng tối đa cho phép), `excused_count` (nghỉ có phép).
  - Bổ sung thẻ thống kê số lượng sinh viên bị cấm thi trên toàn lớp.
  - Cột *Trạng thái dự thi*: Sinh viên có `is_banned === true` được gắn huy hiệu đỏ rực **"CẤM THI"** kèm tooltip giải thích vi phạm; sinh viên đủ điều kiện hiển thị huy hiệu xanh lá "Đủ điều kiện".
  - Tô màu cảnh báo nền dòng sinh viên bị cấm thi.

### E. Cấu Hình Khóa Học (Courses)
- [`frontend-web/src/pages/Courses.jsx`](file:///frontend-web/src/pages/Courses.jsx):
  - Thêm 2 state: `newCourseTotalSessions` (mặc định `'10'`) và `newCourseMaxAbsences` (mặc định `'2'`).
  - Modal "Tạo Khóa Học Phần Mới" bổ sung 2 ô input số có validation (`min="1"` cho tổng số buổi, `min="0"` cho số buổi vắng tối đa).
  - Hàm `handleCreateCourse` cập nhật payload gửi lên `POST /api/courses` với `totalSessions` và `maxAbsences`.
  - Hiển thị số buổi học và quy chế vắng trên tiêu đề chi tiết lớp học.

---

## 4. Danh Sách Tuyến Đường (Routes) & Phân Quyền

| Tuyến đường | Component | Quyền hạn | Mô tả |
|---|---|---|---|
| `/courses` | `Courses.jsx` | All (Login required) | Quản lý khóa học, danh sách SV, cấu hình buổi học |
| `/users` | `Users.jsx` | **Admin Only** | Quản trị tài khoản, reset pass, gỡ thiết bị, khóa user, import CSV |
| `/leave-requests` | `LeaveRequests.jsx` | **Lecturer Only** | Xét duyệt đơn xin nghỉ phép theo lớp học phần |
| `/qr-projector` | `QRProjector.jsx` | **Lecturer Only** | Máy chiếu QR điểm danh thời gian thực tích hợp định vị GPS |
| `/statistics` | `Statistics.jsx` | All (Login required) | Bảng thống kê chuyên cần, cảnh báo cấm thi & xuất file CSV |

---

## 5. Kết Quả Kiểm Thử & Đóng Gói

- **ESLint:**
  ```bash
  npm --prefix frontend-web run lint
  # Result: 0 error, 0 warning
  ```
- **Vite Build Production:**
  ```bash
  npm --prefix frontend-web run build
  # Result: Build thành công 100%, tạo bundle tối ưu tại dist/
  ```
- **Backend Safety:** Thư mục `backend/` được bảo toàn nguyên vẹn 100%, không bị sửa đổi bất kỳ dòng nào so với nhánh chính.
