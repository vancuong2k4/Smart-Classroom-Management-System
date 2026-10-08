# 📋 T007 — Thống kê & Báo cáo Điểm danh (Analytics & Reporting)

| Thuộc tính | Giá trị |
|---|---|
| **Task ID** | T007 |
| **Stream** | Backend |
| **Epic** | Reporting & Analytics |
| **Người phụ trách** | Cường (Backend/DevOps Lead) |
| **Trạng thái** | ✅ Hoàn thành |
| **Definition of Done** | Có API báo cáo tổng quan (đếm tổng số buổi vắng/có mặt), API xuất file CSV, và API xem lịch sử cá nhân cho sinh viên. |

---

## 1. Mục tiêu
Sau khi đã thu thập được dữ liệu điểm danh, hệ thống cần cung cấp các công cụ báo cáo mạnh mẽ để:
- **Giảng viên:** Xem tổng quan tình hình lớp học, phát hiện sinh viên vắng nhiều, tính điểm chuyên cần, tải báo cáo dạng CSV để nộp về trường.
- **Sinh viên:** Theo dõi tiến độ cá nhân để có kế hoạch đi học bổ sung, tránh rớt môn do nghỉ quá số buổi.

## 2. API Reference

Tất cả API báo cáo được đặt tại prefix `/api/reports`.

### 2.1 Báo cáo Tổng quan Khóa học (Giảng viên / Admin)
- **Endpoint:** `GET /api/reports/courses/:courseId`
- **Quyền:** `ADMIN`, `LECTURER` (Chỉ Lecturer được phân công lớp này).
- **Mô tả:** Trả về danh sách tất cả sinh viên trong lớp, kèm theo số buổi Điểm danh hợp lệ, Đi muộn, Lỗi vị trí, và Tính toán **Số buổi Vắng**.
- **Cách tính Vắng (ABSENT):** Vì sinh viên không đi học sẽ không sinh ra record điểm danh, nên backend dùng SQL `LEFT JOIN` và công thức: `Vắng = Tổng_số_phiên_của_lớp - Có_Mặt - Đi_Muộn`.

### 2.2 Xuất Báo Cáo ra CSV
- **Endpoint:** `GET /api/reports/courses/:courseId/export`
- **Mô tả:** Trả về file định dạng Text/CSV. Giảng viên có thể gọi URL này trực tiếp trên trình duyệt (hoặc Frontend tạo thẻ `<a>` download), file sẽ tự tải về với tên `Attendance_Report_Course_{id}.csv`. Hỗ trợ BOM UTF-8 nên mở bằng Excel không bị lỗi phông tiếng Việt.

### 2.3 Lịch sử điểm danh cá nhân (Sinh viên)
- **Endpoint:** `GET /api/reports/me?courseId=1`
- **Quyền:** `STUDENT`
- **Mô tả:** Trả về lịch sử điểm danh của chính sinh viên đang đăng nhập, được sắp xếp mới nhất lên đầu. Trạng thái `ABSENT` được suy ra bằng cách `LEFT JOIN` lịch sử phiên với bản ghi điểm danh của SV đó. (Nếu `a.status IS NULL` -> `ABSENT`).

## 3. Advanced SQL Concept
Task này biểu diễn cách sử dụng các tính năng nâng cao của PostgreSQL để giảm tải cho Node.js:
- **CTE (Common Table Expressions):** Dùng cú pháp `WITH ... AS (...)` để chia nhỏ luồng xử lý bảng: Tính tổng số buổi trước, tính số có mặt sau, rồi `JOIN` lại với nhau.
- **Aggregation Filters:** Dùng `COUNT(*) FILTER (WHERE status = 'PRESENT')` để đếm trực tiếp theo điều kiện trên từng dòng mà không cần dùng `CASE WHEN` phức tạp.
- **COALESCE:** Để đổi giá trị `NULL` thành số `0` hoặc chuỗi `'ABSENT'`.

## 4. Các file đã tạo / chỉnh sửa
- `src/models/report.model.js` (Chứa 2 câu query SQL phức tạp).
- `src/services/report.service.js` (Chứa logic và hàm sinh file CSV).
- `src/controllers/report.controller.js` (Response JSON và thiết lập HTTP Header xuất file tải về `Content-Disposition: attachment`).
- `src/routes/report.routes.js`
- Chỉnh sửa `src/routes/index.js` để gắn router `/api/reports`.
