# T013 — Khởi tạo Mobile App và đăng nhập API

| Thuộc tính | Giá trị |
|---|---|
| Task ID | T013 |
| Stream | Mobile |
| Epic | Ứng dụng sinh viên |
| Người phụ trách | Phạm Hoàng Bảo |
| Trạng thái | Chờ review |
| Definition of Done | Khởi tạo app, đăng nhập API, lưu JWT, tạo 3 tab; kiểm thử đăng nhập đúng và sai. |

## 1. Mục tiêu
Khởi tạo ứng dụng sinh viên và kết nối API đăng nhập Backend.

## 2. Những gì đã làm
- Khởi tạo Expo, React Native và TypeScript.
- Thiết kế giao diện trắng – xanh dương.
- Gọi POST /api/auth/login.
- Lưu JWT bằng SecureStore với khóa smartclass_token.
- Tạo 3 tab: Trang chủ, Quét QR, Lịch sử.
- Thêm đăng xuất, xóa token và thông báo lỗi.
- Điều chỉnh validator hỗ trợ tên đăng nhập có dấu và khoảng trắng.
- Merge bản sửa khởi động Backend từ main.

Các file chính:
- frontend-mobile/App.tsx.
- frontend-mobile/package.json và package-lock.json.
- frontend-mobile/app.json.
- backend/src/validators/auth.validator.js.
- backend/src/app.js.

## 3. Cách chạy
- Mở Docker Desktop.
- Tại thư mục gốc: docker compose up -d --build backend
- Mở Terminal khác, vào frontend-mobile, chạy npm ci.
- Chạy npx expo start --lan.
- Mac và iPhone dùng cùng Wi-Fi; quét QR để mở Expo Go.
- API dùng IP LAN của Mac, cổng 3000.
- Địa chỉ kiểm thử gần nhất: http://192.168.1.7:3000/api
- Đăng nhập bằng tài khoản sinh viên trong database kiểm thử.

## 4. Quyết định kỹ thuật
- Expo để chạy thử trên thiết bị thật.
- React Navigation để điều hướng.
- SecureStore để lưu JWT.
- HTTP qua LAN trong môi trường phát triển.

## 5. Kết quả kiểm thử
- Đăng nhập sinh viên và chuyển cả 3 tab sau cập nhật Backend: thành công trên iPhone.
- Sai mật khẩu và đăng xuất: đã kiểm tra ở lần trước.
- Backend sau merge: Redis kết nối, server chạy cổng 3000.
- Chưa kiểm thử Android.

## 6. Lưu ý và việc còn tồn đọng
- Quét QR và Lịch sử hiện là giao diện khung.
- Chưa tự động khôi phục phiên khi mở lại app.
- Chưa kiểm tra vai trò STUDENT ở luồng đăng nhập Mobile.
- IP Backend đang đặt trực tiếp trong App.tsx.
- Tên tài khoản Hoàng Bảo đã đổi trong database cục bộ; thay đổi này không đi theo code Git.
- Cần thống nhất quy tắc tên đăng nhập có dấu, khoảng trắng và phân biệt hoa/thường với Backend.
