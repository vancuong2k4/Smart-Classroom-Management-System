# README_T022 — Quản Lý Buổi Học Theo Lộ Trình (Session Numbering), Sổ Điểm Danh Chi Tiết Từng Buổi & Đồng Bộ Điểm Danh Đa Nền Tảng

## 1. Bảng Thông Tin

| Thuộc tính | Chi tiết |
|---|---|
| **Task ID** | T022 |
| **Stream** | Fullstack / Backend / Frontend Web / Frontend Mobile |
| **Epic** | Quản Lý Lộ Trình Học Phần, Minh Bạch Hóa Điểm Danh Chi Tiết & Đồng Bộ Trạng Thái Đa Nền Tảng |
| **Người phụ trách** | Cường (Backend / DevOps Lead), Thư (Web / BA Lead), Bảo (Mobile / QA Lead) |
| **Trạng thái** | ✅ Hoàn thành (Migration DB thành công, Web Build pass, Mobile TypeScript 0 lỗi) |
| **Definition of Done** | - Thêm cột `session_number` vào bảng `sessions`, đánh index và backfill dữ liệu cũ.<br>- Giảng viên được chủ động chọn buổi học (Buổi 1, Buổi 2... / Tổng số buổi) khi mở phiên quét QR.<br>- Trang Thống kê bổ sung Roadmap thẻ buổi học và Modal "Sổ Điểm danh Chi tiết" (hiển thị 100% sinh viên lớp, phân loại 5 trạng thái: Có mặt, Đi muộn, Có phép, Vắng, Lỗi vị trí, kèm GPS và IP).<br>- Chuẩn hóa công thức đếm số buổi đã học `held_sessions = COUNT(DISTINCT session_number)`.<br>- App Mobile hiển thị buổi học theo định dạng `Buổi X / Y`, thông báo quét mã thành công theo buổi.<br>- Khắc phục triệt để lỗi "Chưa xác định" trên Mobile: bổ sung ánh xạ trạng thái `EXCUSED` ("Nghỉ có phép") đồng bộ 100% với Web. |

---

## 2. Mục Tiêu Nghiệp Vụ

1. **Bám sát thực tế đào tạo đại học:** Một học phần có số buổi quy định (ví dụ 10 hoặc 15 buổi). Trước đây, hệ thống chỉ sinh mã `session_id` tự do, khiến giảng viên không chọn được buổi học cụ thể và nếu mở 2 lần trong 1 ngày sẽ gây sai lệch số buổi đã học (`held_sessions`). Hệ thống cần cho phép Giảng viên chọn chính xác buổi học cần mở (kèm gợi ý buổi kế tiếp) và cho phép mở lại buổi cũ để sinh viên quét bù nếu cần mà không làm sai lệch số buổi thực tế.
2. **Minh bạch hóa Sổ điểm danh từng buổi:** Trang Thống kê trước đây chỉ xem được tỷ lệ tổng hợp toàn môn. Giảng viên và Ban cán sự cần click vào từng buổi học để mở **Sổ Điểm danh Chi tiết** xem rõ từng sinh viên vắng, muộn, có phép hay vi phạm vị trí (kèm khoảng cách GPS và IP cụ thể).
3. **Đồng bộ trạng thái Nghỉ có phép (`EXCUSED`) đa nền tảng:** Khi đơn xin nghỉ phép được duyệt, trạng thái phải thể hiện thống nhất trên Web Thống kê và Lịch sử điểm danh Mobile của Sinh viên, loại bỏ hoàn toàn tình trạng hiển thị "Chưa xác định".

---

## 3. Những Gì Đã Làm (Files & Modifications)

### A. Cơ Sở Dữ Liệu & Backend
- **Database Migration:**
  - Tạo file migration `backend/migrations/20261124010000-add-session-number.js` và cặp SQL `up/down`.
  - Thêm cột `session_number INTEGER NOT NULL DEFAULT 1` vào bảng `sessions`.
  - Đánh chỉ mục `idx_sessions_course_session_number` tối ưu truy vấn theo môn học và buổi.
  - Sử dụng hàm cửa sổ `ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY start_time ASC)` để tự động đánh số thứ tự chuẩn xác cho toàn bộ các phiên học lịch sử.
- [`backend/src/models/session.model.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/models/session.model.js):
  - Bổ sung `s.session_number` vào `BASE_SELECT` và câu lệnh `create()`.
- [`backend/src/validators/session.validator.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/validators/session.validator.js):
  - Kiểm thực tham số `session_number`: số nguyên dương hợp lệ.
- [`backend/src/services/session.service.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/services/session.service.js):
  - Ràng buộc: `1 <= session_number <= course.total_sessions`.
  - Tự động gợi ý buổi kế tiếp: `COALESCE(MAX(session_number), 0) + 1`.
  - Tự động liên kết các đơn xin nghỉ phép đã duyệt (`APPROVED`) trong ngày sang trạng thái `EXCUSED`.
- [`backend/src/models/attendance.model.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/models/attendance.model.js):
  - Thêm hàm `getFullSessionRoster(sessionId)`: Trả về danh sách 100% sinh viên ghi danh trong lớp, kết hợp dữ liệu điểm danh (`COALESCE(a.status, 'ABSENT')`), khoảng cách GPS (`distance_meters`) và IP quét.
  - Sắp xếp ưu tiên: `INVALID_LOCATION` -> `ABSENT` -> `EXCUSED` -> `LATE` -> `PRESENT`.
- [`backend/src/controllers/session.controller.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/controllers/session.controller.js):
  - Endpoint `GET /api/sessions/:id` trả về thêm danh sách `full_roster`.
- [`backend/src/models/report.model.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/models/report.model.js):
  - Chuẩn hóa đếm buổi học: `COUNT(DISTINCT s.session_number)` thay vì đếm số phiên thô.
  - Bổ sung `s.session_number` vào kết quả `getStudentHistory`.
- [`backend/src/services/attendance.service.js`](file:///d:/github/Smart-Classroom-Management-System/backend/src/services/attendance.service.js):
  - Trả về `sessionNumber`, `courseCode`, `courseName` trong phản hồi quét mã QR.

---

### B. Frontend Web (Giảng Viên & Quản Trị Viên)
- [`frontend-web/src/pages/QRProjector.jsx`](file:///d:/github/Smart-Classroom-Management-System/frontend-web/src/pages/QRProjector.jsx):
  - Thêm dropdown "Chọn buổi học cần điểm danh" với badge trạng thái trực quan:
    - `✓ Đã học (dd/mm)`: Buổi học trước đó đã tổ chức.
    - `🔥 Đang mở`: Buổi học đang có phiên hoạt động.
    - `Chưa học`: Buổi học tiếp theo trong lộ trình.
  - Cảnh báo màu vàng khi Giảng viên chọn mở lại buổi học đã từng tổ chức.
  - Cơ chế tự động khôi phục phiên đang mở khi Giảng viên chuyển tab hoặc tải lại trang mà không làm mất mã QR hay đếm ngược thời gian.
- [`frontend-web/src/pages/Statistics.jsx`](file:///d:/github/Smart-Classroom-Management-System/frontend-web/src/pages/Statistics.jsx):
  - Bổ sung hàng thẻ lộ trình buổi học (Roadmap Cards): Thể hiện trực quan từng buổi học (`Buổi 1`, `Buổi 2`...), ngày giờ diễn ra, tỷ lệ chuyên cần.
  - Tích hợp Modal **"Sổ Điểm danh Chi tiết"**:
    - Thống kê nhanh: Sĩ số, Có mặt, Đi muộn, Nghỉ có phép, Vắng K.Phép, Lỗi vị trí.
    - Bộ lọc nhanh (Filter Tabs) theo từng trạng thái.
    - Tìm kiếm sinh viên theo tên hoặc mã sinh viên (MSSV).
    - Hiển thị khoảng cách GPS thực tế (mét) và địa chỉ IP của từng sinh viên.

---

### C. Frontend Mobile (Sinh Viên)
- [`frontend-mobile/App.tsx`](file:///d:/github/Smart-Classroom-Management-System/frontend-mobile/App.tsx):
  - Cập nhật kiểu `Attendance`: bổ sung `session_number` và `total_sessions`.
  - Màn hình Lịch sử điểm danh (`HistoryScreen`): Hiển thị tiêu đề thẻ theo định dạng `[Mã môn] · Buổi X / Y`.
  - Bổ sung trạng thái `EXCUSED` vào `statusLabels`:
    - Nhãn: **"Nghỉ có phép"**
    - Màu chữ: `#2563EB`, màu nền badge: `#EFF6FF`.
    - Ngữ cảnh thời gian: Hiển thị `Duyệt phép lúc: ...` đối với trường hợp được duyệt nghỉ học.
- [`frontend-mobile/useAttendanceCheckin.ts`](file:///d:/github/Smart-Classroom-Management-System/frontend-mobile/useAttendanceCheckin.ts):
  - Cập nhật thông báo quét mã thành công: `"Buổi X (Tên môn): Bạn đã được ghi nhận có mặt/đi muộn."`

---

## 4. Cách Kiểm Thử & Xác Minh

1. **Kiểm tra Cơ sở dữ liệu:**
   - Đã chạy migration thành công, xác minh cấu trúc bảng `sessions` có cột `session_number` và index.
2. **Kiểm tra Frontend Web:**
   - Chạy `npm run build --prefix frontend-web`: Vite build thành công không có lỗi.
3. **Kiểm tra Frontend Mobile:**
   - Chạy `tsc --noEmit --project frontend-mobile/tsconfig.json`: Hoàn thành với 0 lỗi kiểu dữ liệu TypeScript.
4. **Kiểm tra Trực quan:**
   - Mở máy chiếu QR -> Chọn buổi học bất kỳ -> Tạo phiên thành công.
   - Kiểm tra trang Thống kê -> Click vào thẻ Buổi học -> Modal Sổ điểm danh chi tiết hiển thị đầy đủ 100% sinh viên lớp kèm trạng thái.
   - Kiểm tra sinh viên có đơn nghỉ phép được duyệt -> Lịch sử điểm danh trên Mobile hiển thị huy hiệu xanh dương "Nghỉ có phép".
