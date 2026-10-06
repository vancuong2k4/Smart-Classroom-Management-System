# 📋 T004 — Seed Admin & Quản lý Lớp học (Courses / Enrollments)

| Thuộc tính | Giá trị |
|---|---|
| **Task ID** | T004 |
| **Stream** | Backend |
| **Epic** | Core Services (API) |
| **Người phụ trách** | Cường (Backend/DevOps Lead) |
| **Trạng thái** | ✅ Hoàn thành (2026-10-06) |
| **Definition of Done** | Có script tạo ADMIN; API CRUD lớp học và thêm/xóa SV khỏi lớp, phân quyền đúng theo vai trò và quyền sở hữu lớp |

---

## 1. Mục tiêu
- Giải quyết 2 việc tồn đọng: **chưa có cách tạo ADMIN** (README_T003) và **bảng `courses` chưa biết giảng viên phụ trách** (README_T002).
- Cung cấp API để Admin/Giảng viên tạo lớp và đưa SV vào lớp — **điều kiện tiên quyết** để làm phiên điểm danh (QR) ở các Task sau.

## 2. Thay đổi Database — migration `20261005173112-add-lecturer-to-courses`
```sql
ALTER TABLE courses ADD COLUMN lecturer_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_courses_lecturer_id ON courses(lecturer_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
```
| Quyết định | Lý do |
|---|---|
| `lecturer_id` cho phép `NULL` | Admin có thể tạo lớp trước, phân công giảng viên sau |
| `ON DELETE SET NULL` (không phải CASCADE) | Xóa tài khoản GV **không được** làm mất lớp và lịch sử điểm danh |
| 2 index mới | Tăng tốc 2 truy vấn dùng nhiều nhất: "lớp của GV X" và "SV của lớp Y" |

> 👥 **Thành viên khác cần chạy `npm run migrate`** sau khi `git pull` để DB cập nhật cột mới.

## 3. Ma trận phân quyền

| Hành động | ADMIN | LECTURER | STUDENT |
|---|---|---|---|
| Xem danh sách lớp `GET /courses` | Tất cả | Lớp mình dạy | Lớp đã đăng ký |
| Xem chi tiết lớp | ✅ | Lớp mình dạy | Lớp đã đăng ký |
| Tạo lớp | ✅ (chọn GV bất kỳ) | ✅ (tự gán cho mình) | ❌ |
| Sửa tên / mã lớp | ✅ | Lớp mình dạy | ❌ |
| Phân công / đổi giảng viên | ✅ | ❌ | ❌ |
| Xóa lớp | ✅ | ❌ | ❌ |
| Xem / thêm / xóa SV trong lớp | ✅ | Lớp mình dạy | ❌ |

**Phân quyền 2 lớp:**
1. **Route** (`authorize(...)`) — chặn theo **vai trò** (vd: STUDENT không được tạo lớp).
2. **Service** (`getManageableCourse`) — chặn theo **quyền sở hữu** (vd: GV A không được sửa lớp của GV B). Route không làm được việc này vì cần tra DB.

## 4. API Reference
Tất cả endpoint đều cần header `Authorization: Bearer <token>`.

### Courses
| Method | Endpoint | Body |
|---|---|---|
| `GET` | `/api/courses` | — |
| `POST` | `/api/courses` | `{ "code": "INT3306", "name": "Lập trình Web", "lecturer_id": 5 }` (`lecturer_id` tùy chọn, chỉ ADMIN dùng) |
| `GET` | `/api/courses/:id` | — |
| `PATCH` | `/api/courses/:id` | Một hoặc nhiều field: `code`, `name`, `lecturer_id` (`null` = bỏ phân công) |
| `DELETE` | `/api/courses/:id` | — |

Mỗi course trả về:
```json
{
  "id": 1, "code": "INT3306", "name": "Lập trình Web",
  "lecturer_id": 5, "lecturer_username": "gv_nguyenvana",
  "student_count": 42, "created_at": "..."
}
```
- `code`: 2–50 ký tự (chữ, số, `_` `.` `-`), **tự chuyển IN HOA**.
- `student_count` và `lecturer_username` có sẵn → Frontend không cần gọi thêm API.

### Enrollments (SV trong lớp)
| Method | Endpoint | Body |
|---|---|---|
| `GET` | `/api/courses/:id/students` | — → `data.students: [{ id, username, enrolled_at }]` |
| `POST` | `/api/courses/:id/students` | `{ "usernames": ["sv001", "sv002"] }` (tối đa 200/lần) |
| `DELETE` | `/api/courses/:id/students/:studentId` | — |

**Thêm SV hàng loạt — "thành công một phần":** không vì 1 MSSV sai mà hủy cả danh sách. Response luôn `200` kèm báo cáo:
```json
{
  "status": "success",
  "message": "Added 2 student(s) to the course",
  "data": {
    "added": [{ "id": 7, "username": "sv001" }, { "id": 8, "username": "sv002" }],
    "already_enrolled": ["sv003"],
    "not_found": ["sv999"],
    "not_student": ["gv_nguyenvana"]
  }
}
```
> 💡 **Cho Thư (Frontend Web):** hiển thị 4 nhóm này cho giảng viên sau khi import danh sách lớp.

### Mã lỗi mới
| HTTP | Khi nào |
|---|---|
| 400 | `:id` không phải số nguyên dương; `code`/`name` sai định dạng; `lecturer_id` không phải tài khoản LECTURER |
| 403 | Không có quyền với lớp này (không phải chủ lớp / chưa đăng ký) |
| 404 | Lớp không tồn tại; SV không có trong lớp (khi xóa) |
| 409 | Mã lớp đã tồn tại |

## 5. Script tạo ADMIN
```bash
# 1. Thêm vào backend/.env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<mật khẩu mạnh, 8-72 ký tự>

# 2. Chạy
cd backend
npm run seed:admin
```
- **Idempotent:** chạy lại nhiều lần không tạo trùng (`User "admin" already exists. Nothing to do.`).
- **Từ chối** nếu `ADMIN_PASSWORD` vẫn là giá trị mẫu trong `.env.example` hoặc ngắn hơn 8 ký tự.
- Dùng lại `authService.createAccount` → cùng logic mã hóa bcrypt với API đăng ký.

## 6. Các file đã tạo / sửa
| Loại | File |
|---|---|
| Migration | `migrations/20261005173112-add-lecturer-to-courses.js` + 2 file `.sql` |
| Script | `scripts/seed-admin.js` |
| Constants | `src/constants/roles.js` — `ROLES.ADMIN / LECTURER / STUDENT` |
| Utils | `src/utils/pgErrors.js` — mã lỗi PostgreSQL dùng chung |
| Model | `src/models/course.model.js`, `src/models/enrollment.model.js`; sửa `user.model.js` (+`findByUsernames`) |
| Service | `src/services/course.service.js`, `src/services/enrollment.service.js`; refactor `auth.service.js` (tách `createAccount`) |
| Validator | `src/validators/common.validator.js` (`validateIdParams`), `src/validators/course.validator.js` |
| Controller | `src/controllers/course.controller.js`, `src/controllers/enrollment.controller.js` |
| Route | `src/routes/course.routes.js`; sửa `routes/index.js` |
| Config | `package.json` (+`seed:admin`), `.env.example` (+`ADMIN_USERNAME`, `ADMIN_PASSWORD`) |

## 7. Ghi chú kỹ thuật
- **Thêm SV hàng loạt chỉ tốn 1 câu INSERT:** `INSERT ... SELECT $1, unnest($2::int[]) ON CONFLICT DO NOTHING RETURNING student_id`. SV đã có trong lớp tự bị bỏ qua nhờ `UNIQUE(student_id, course_id)` từ T002.
- **PATCH động an toàn:** `course.model.update` chỉ ghép tên cột từ whitelist `UPDATABLE_COLUMNS`; giá trị vẫn truyền qua `$1, $2...`.
- **Username được chuẩn hóa** (trim + lowercase) giống lúc đăng ký → nhập `" SV001 "` vẫn tìm thấy `sv001`.

## 8. Kết quả kiểm thử (E2E với DB thật) — 43/43 ✅
| Nhóm | Số ca | Ví dụ |
|---|---|---|
| Seed admin | 4 | Từ chối mật khẩu mẫu / quá ngắn; tạo thành công; chạy lại không trùng |
| Tạo lớp | 10 | GV tự được gán; GV không tạo hộ người khác (403); SV không tạo được (403); trùng mã (409); gán STUDENT làm GV (400) |
| Thêm/xem SV | 7 | Báo cáo thành công một phần đúng 4 nhóm; thêm lại → `already_enrolled`; GV khác lớp (403) |
| Xem lớp | 9 | Mỗi role chỉ thấy đúng lớp của mình; SV xem lớp chưa đăng ký (403); id `abc` (400) |
| Sửa lớp | 7 | GV không đổi được `lecturer_id` (403); Admin gán/bỏ gán GV |
| Xóa | 5 | GV không xóa lớp được (403); xóa SV 2 lần (404) |

Dữ liệu test (tiền tố `t4_` / `T4-`) đã được tự động xóa sau khi chạy.

## 9. ⚠️ Lưu ý & Việc còn tồn đọng
- [ ] **Chạy `npm run seed:admin`** với mật khẩu thật để có tài khoản ADMIN đầu tiên.
- [ ] Chưa có API **liệt kê user** (vd: `GET /api/users?role=LECTURER`) → Frontend chưa có danh sách GV để chọn khi phân công. Hiện phải biết `lecturer_id`.
- [ ] `GET /api/courses` chưa có **phân trang / tìm kiếm** — ổn với quy mô hiện tại.
- [ ] Bảng `users` vẫn chưa có `full_name` → danh sách SV chỉ hiện `username`.
- [ ] Chưa có unit test tự động trong repo (mới test E2E thủ công).
