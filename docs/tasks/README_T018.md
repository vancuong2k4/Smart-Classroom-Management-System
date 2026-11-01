# 📋 T018 — Quản lý Tài khoản & Hoàn thiện Phân quyền Khóa học (Users Module & Course RBAC)

| Thuộc tính | Giá trị |
|---|---|
| **Task ID** | T018 |
| **Stream** | Backend |
| **Epic** | Core Services & RBAC |
| **Người phụ trách** | Cường (Backend/DevOps Lead) |
| **Trạng thái** | ✅ Hoàn thành (2026-10-31) |
| **Definition of Done** | API quản lý tài khoản (`/api/users`), hỗ trợ lọc theo role và tìm kiếm; chuẩn hóa phân quyền cho Admin & Giảng viên; hỗ trợ linh hoạt gán/đổi giảng viên phụ trách cho lớp học cả snake_case và camelCase; 10/10 ca kiểm thử pass 100%. |

---

## 1. Mục tiêu
- Cung cấp API `GET /api/users` cho phép lọc theo role (`LECTURER`, `STUDENT`) để Frontend Web có dữ liệu hiển thị danh sách Giảng viên trong các ô chọn (Dropdown/Select) khi phân công lớp học.
- Bổ sung quyền cho ADMIN tạo tài khoản trực tiếp qua API `POST /api/users`.
- Hoàn thiện phân quyền đa cấp giữa ADMIN, LECTURER, và STUDENT ở tầng Service và Validator.
- Hỗ trợ linh hoạt tham số `lecturer_id` / `lecturerId` (snake_case lẫn camelCase) khi tạo và sửa lớp học, giúp Frontend tích hợp mượt mà không gặp lỗi lệch định dạng.

---

## 2. Những gì đã làm

### 2.1. Tầng Model (`backend/src/models/user.model.js`)
- Thêm hàm `findAll({ role, search })`:
  - Dùng parameterized query an toàn với SQL injection.
  - Hỗ trợ lọc theo `role` (`ADMIN`, `LECTURER`, `STUDENT`).
  - Hỗ trợ tìm kiếm không phân biệt hoa thường theo `username` (`LOWER(username) LIKE $...`).
  - Trả về các cột công khai an toàn: `id, username, role, created_at` (loại bỏ `password_hash`).

### 2.2. Tầng Service (`backend/src/services/user.service.js` - MỚI)
- `listUsers(currentUser, { role, search })`:
  - **ADMIN:** Toàn quyền xem mọi tài khoản, xem tất cả hoặc lọc theo role bất kỳ.
  - **LECTURER:** Chỉ được xem danh sách `LECTURER` (đồng nghiệp) hoặc `STUDENT` (tìm kiếm sinh viên để thêm vào lớp). Nếu LECTURER cố tình tra cứu role `ADMIN` hoặc xem toàn bộ hệ thống sẽ bị chặn lỗi 403 Forbidden.
  - **STUDENT:** Bị chặn 403 từ tầng route/middleware.
- `getUserById(currentUser, id)`: Lấy chi tiết thông tin tài khoản.
- `createUser(currentUser, { username, password, role })`: Chỉ cho phép `ADMIN` tạo tài khoản trực tiếp (tránh leo thang đặc quyền).

### 2.3. Tầng Validator (`backend/src/validators/user.validator.js` - MỚI)
- `validateListUsers`: Chuẩn hóa và xác thực query param `role` và `search`.
- `validateCreateUser`: Xác thực username (3-50 ký tự), password (6-72 ký tự) và role hợp lệ.

### 2.4. Tầng Controller & Routes (`backend/src/controllers/user.controller.js` & `backend/src/routes/user.routes.js` - MỚI)
- Đăng ký endpoint tại `backend/src/routes/index.js` dưới tiền tố `/api/users`.
- Chuẩn hóa response theo định dạng chung `{ status: "success", message: "...", data: {...} }`.

### 2.5. Tối ưu Module Khóa học & Báo cáo
- **`backend/src/validators/course.validator.js`**:
  - Hỗ trợ cả `lecturer_id` và `lecturerId` trong `validateCreateCourse` và `validateUpdateCourse`.
  - Hỗ trợ cả `{ username: "sv001" }` (chuỗi đơn) lẫn `{ usernames: ["sv001"] }` (mảng) trong `validateAddStudents`.
- **`backend/src/services/report.service.js`**:
  - Khi xuất báo cáo CSV, lấy tên giảng viên thực tế của môn học (`course.lecturer_username`) thay vì luôn gán tên của người đang bấm nút xuất báo cáo (giúp Admin khi xuất báo cáo vẫn hiển thị đúng Giảng viên phụ trách).

---

## 3. Ma trận phân quyền User & Course API

| Endpoint | Method | ADMIN | LECTURER | STUDENT |
|---|---|---|---|---|
| `/api/users?role=LECTURER` | `GET` | ✅ Xem tất cả | ✅ Xem danh sách GV | ❌ 403 |
| `/api/users?role=STUDENT` | `GET` | ✅ Xem tất cả | ✅ Tìm kiếm SV | ❌ 403 |
| `/api/users` (không role / role=ADMIN) | `GET` | ✅ Xem tất cả | ❌ 403 | ❌ 403 |
| `/api/users` | `POST` | ✅ Tạo mọi role | ❌ 403 | ❌ 403 |
| `/api/courses` (Tạo lớp có chọn GV) | `POST` | ✅ Chọn GV bất kỳ | ✅ Tự gán chính mình | ❌ 403 |
| `/api/courses/:id` (Phân công lại GV) | `PATCH` | ✅ Đổi GV bất kỳ | ❌ 403 | ❌ 403 |
| `/api/courses/:id` (Xóa lớp học) | `DELETE` | ✅ Toàn quyền | ❌ 403 | ❌ 403 |

---

## 4. Hướng dẫn tích hợp cho Frontend Web (Dành cho Thư)

1. **Lấy danh sách Giảng viên để hiển thị trong Dropdown:**
   - **Method:** `GET`
   - **URL:** `/api/users?role=LECTURER`
   - **Header:** `Authorization: Bearer <token>`
   - **Response:**
     ```json
     {
       "status": "success",
       "message": "Get users successfully",
       "data": {
         "users": [
           { "id": 19, "username": "lecturer01", "role": "LECTURER", "created_at": "..." }
         ]
       }
     }
     ```

2. **Admin tạo khóa học có phân công Giảng viên:**
   - **Method:** `POST`
   - **URL:** `/api/courses`
   - **Body:** `{ "code": "INT3306", "name": "Lập trình Web", "lecturerId": 19 }` (hoặc `lecturer_id: 19`)

3. **Admin phân công / đổi Giảng viên phụ trách:**
   - **Method:** `PATCH`
   - **URL:** `/api/courses/:id`
   - **Body:** `{ "lecturerId": 19 }` (hoặc `null` để hủy phân công)

4. **Admin xóa lớp học:**
   - **Method:** `DELETE`
   - **URL:** `/api/courses/:id`

---

## 5. Kết quả kiểm thử (Automated Integration Test)
Đã chạy bộ test tự động kiểm thử toàn diện 10 kịch bản:
- ✅ Đăng nhập và xác thực Token cho Admin, Lecturer, Student: Đạt
- ✅ `GET /api/users` với Admin: Đạt (trả về đầy đủ 12 tài khoản)
- ✅ `GET /api/users?role=LECTURER` với Admin & Lecturer: Đạt (trả về danh sách giảng viên)
- ✅ `GET /api/users?role=STUDENT` với Admin & Lecturer: Đạt (trả về danh sách sinh viên)
- ✅ Chặn LECTURER xem tài khoản ADMIN hoặc tra cứu toàn bộ người dùng: Đạt (403 Forbidden)
- ✅ Chặn LECTURER tạo tài khoản mới: Đạt (403 Forbidden)
- ✅ Chặn STUDENT truy cập API Users: Đạt (403 Forbidden)
- ✅ ADMIN tạo lớp học với `lecturerId` camelCase: Đạt (201 Created)
- ✅ ADMIN phân công lại giảng viên sang `lecturer01`: Đạt (200 OK)
- ✅ Chặn LECTURER tự ý đổi giảng viên phụ trách môn học: Đạt (403 Forbidden)
- ✅ ADMIN xóa khóa học: Đạt (200 OK)
