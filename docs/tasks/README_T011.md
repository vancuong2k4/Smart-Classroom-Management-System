# 📋 T011 — Màn hình Máy chiếu QR Realtime

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Task ID** | T011 |
| **Stream** | Frontend Web / Realtime Attendance Screen |
| **Module** | Dynamic QR Projector |
| **Epic** | Realtime Attendance Engine |
| **Người phụ trách** | Thư (Frontend Web Lead) |
| **Trạng thái** | ✅ Hoàn thành (2026-10-16) |
| **Definition of Done** | Màn hình máy chiếu hiển thị mã QR Code sống, tự động đếm ngược và nhảy mã mới mỗi 10 giây không cần F5. |

---

## 1. Mục tiêu
Thiết kế màn hình Máy chiếu chuyên dụng cho Giảng viên bật tại lớp học, tự động sinh và xoay vòng mã QR bảo mật để sinh viên dùng App di động quét điểm danh, chống hành vi chụp ảnh mã QR gửi cho người khác.

---

## 2. Những gì đã làm

### 2.1. Cấu hình Phiên điểm danh
* Cho phép chọn Lớp học phần cần điểm danh.
* Lựa chọn thời lượng phiên điểm danh linh hoạt: 15, 30, 45, 60 phút.
* Nút bấm chủ động: **"Mở phiên điểm danh ngay"** và **"Kết thúc phiên điểm danh"**.

### 2.2. Động cơ QR Code Realtime (`qrcode.react`)
* Tích hợp thư viện `qrcode.react` (`QRCodeSVG`) vẽ mã QR kích thước lớn (220x220px) chuẩn nét cho máy chiếu.
* **Tự động đổi mã ngẫu nhiên mỗi 10 giây**: Sử dụng React `useEffect` + `useCallback` đếm ngược từ 10s về 0s để đổi Token ngẫu nhiên (`SCMS-SESSION-...`).
* Tích hợp đồng hồ đếm ngược tổng thời gian còn lại của phiên học.

---

## 3. Cách kiểm tra (Testing)
1. Truy cập `http://localhost:5173/qr-projector`.
2. Nhấn nút màu xanh **"Mở phiên điểm danh ngay"**.
3. Quan sát màn hình bên phải: Mã QR Code màu đen trắng xuất hiện, thanh đếm ngược nhảy từ `10s` về `1s` và tự đổi hình vẽ mã QR mới mà không cần bấm F5 trình duyệt.