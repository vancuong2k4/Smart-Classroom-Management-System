# 📋 T009 — Giao diện Đăng nhập & Bố cục ứng dụng (Web Auth & Layout)

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Task ID** | T009 |
| **Stream** | Frontend Web / UI Framework |
| **Module** | Authentication & App Layout |
| **Epic** | Web Core Infrastructure |
| **Người phụ trách** | Thư (Frontend Web Lead) |
| **Trạng thái** | ✅ Hoàn thành (2026-10-16) |
| **Definition of Done** | Đăng nhập thành công, lưu JWT Token vào LocalStorage, Router Guard bảo vệ trang nội bộ và Layout Sidebar Zalo Blue chuẩn. |

---

## 1. Mục tiêu
Thiết kế và lập trình màn hình Đăng nhập (Login) cho Giảng viên/Cán bộ nhà trường, tích hợp lưu trữ Token xác thực và dựng khung Bố cục chung (Layout) cho toàn bộ ứng dụng Web Admin với tông màu Zalo Blue Clean Modern.

---

## 2. Những gì đã làm

### 2.1. Cấu trúc Module & Router
* **`src/pages/Login.jsx`**: Màn hình đăng nhập thiết kế khung Card tập trung, hỗ trợ ẩn/hiện mật khẩu và xử lý lỗi/fallback dữ liệu.
* **`src/components/Layout.jsx`**: Khung cố định chứa **Sidebar** bên trái điều hướng 3 chức năng chính và **Header** hiển thị thông tin Giảng viên đăng nhập (`GV-2026`) kèm nút Đăng xuất (Logout).
* **`src/App.jsx`**: Cấu hình React Router DOM v6 với cơ chế **Router Guard**:
  * `ProtectedRoute`: Chặn người dùng chưa có Token truy cập trang nội bộ.
  * `PublicOnlyRoute`: Tự động chuyển hướng về `/courses` nếu người dùng đã đăng nhập.

### 2.2. Xử lý Token & Xác thực
* Tự động lưu `token` và thông tin `user` vào `localStorage`.
* Đã cấu hình Axios Client gửi kèm Header `Authorization: Bearer <token>` cho các request sau.
* Tích hợp chế độ **Mock Data dự phòng** tự động kích hoạt nếu Backend chưa bật/trả lỗi 404, giúp nhóm test UI mượt mà.

---

## 3. Cách kiểm tra (Testing)
1. Mở trình duyệt tại `http://localhost:5173/login`.
2. Thử truy cập thẳng `http://localhost:5173/courses` -> Hệ thống tự động đẩy về `/login`.
3. Nhập tài khoản và bấm **"Đăng nhập hệ thống"** -> Tự động lưu Token và chuyển hướng vào trang `/courses`.
4. Bấm nút **"Đăng xuất"** trên Header -> Hệ thống xóa Token và đưa về `/login`.