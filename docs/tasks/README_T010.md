# 📋 T010 — Dashboard Quản lý Khóa học & Danh sách Sinh viên

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Task ID** | T010 |
| **Stream** | Frontend Web / Course Management |
| **Module** | Course & Student Roster Management |
| **Epic** | Academic Operations |
| **Người phụ trách** | Thư (Frontend Web Lead) |
| **Trạng thái** | ✅ Hoàn thành (2026-10-16) |
| **Definition of Done** | Hiển thị danh sách lớp học phần, Modal tạo lớp học mới, và Bảng quản lý sinh viên (thêm/xóa sinh viên theo MSSV). |

---

## 1. Mục tiêu
Xây dựng giao diện Dashboard cho Giảng viên xem toàn bộ danh sách lớp học phần mình giảng dạy, cho phép tạo lớp mới qua Popup Modal và quản lý danh sách sinh viên tham gia từng lớp.

---

## 2. Những gì đã làm

### 2.1. Quản lý Lớp học phần
* **Thẻ môn học (Course Card)**: Hiển thị Mã môn, Tên lớp học phần, Sĩ số sinh viên. Khi click chọn card sẽ mở Bảng sinh viên tương ứng.
* **Modal Popup tạo lớp**: Nhập Mã môn (ví dụ: `WEB302`) và Tên lớp phần (ví dụ: `Lập trình Web nâng cao - Nhóm 01`).
* **Thanh tìm kiếm**: Lọc nhanh các lớp học phần theo từ khóa tiếng Việt.

### 2.2. Quản lý Danh sách Sinh viên
* **Bảng danh sách (Student Roster Table)**: Cung cấp thông tin STT, Mã sinh viên (Username), Họ tên, Email nhà trường.
* **Thêm sinh viên**: Form nhập Username / MSSV (ví dụ: `231A010203`) để gán trực tiếp sinh viên vào lớp.
* **Xóa sinh viên**: Nút icon thùng rác hỗ trợ loại bỏ sinh viên khỏi danh sách lớp với hộp thoại xác nhận.

---

## 3. Cách kiểm tra (Testing)
1. Truy cập `http://localhost:5173/courses`.
2. Bấm **"Thêm Khóa học"** -> Điền Mã môn & Tên môn -> Bấm "Tạo lớp ngay" -> Lớp mới xuất hiện lập tức.
3. Nhập MSSV vào ô "Nhập MSSV / Username..." -> Bấm **"Thêm SV"** -> Sinh viên được thêm trực tiếp vào bảng bên dưới.