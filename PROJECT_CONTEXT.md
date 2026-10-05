# 🎯 Bối Cảnh Dự Án: Smart Classroom Management System

## 1. Tổng quan (Project Overview)
Hệ thống điểm danh thông minh chống gian lận bằng cách kết hợp 3 lớp bảo mật:
- **Dynamic QR Code:** Mã QR hiển thị trên máy chiếu của giảng viên, tự động thay đổi mỗi 10 giây.
- **GPS Location:** Kiểm tra bán kính 50m giữa tọa độ của sinh viên lúc quét mã và tọa độ phòng học.
- **Wi-Fi IP:** Xác thực IP mạng của sinh viên phải khớp với dải IP của trường học.

## 2. Tech Stack (Kiến trúc công nghệ)
- **Backend:** Node.js (Express), viết bằng JavaScript (hoặc TypeScript tùy cấu hình sau).
- **Database:** PostgreSQL (sử dụng PostGIS extension cho các truy vấn tính toán tọa độ).
- **Cache/Realtime:** Redis (Dùng để lưu mã QR Token có thời hạn TTL 10 giây và quản lý Websocket pub/sub).
- **Mô hình kiến trúc:** MVC (Controller - Service - Model/Data Access). Mọi logic nghiệp vụ (tính toán, gen mã) phải nằm ở tầng `services/`.

## 3. Database Schema (Cốt lõi)
Hệ thống gồm 5 bảng chính:
1. `users`: Lưu Admin, Giảng viên (LECTURER), Sinh viên (STUDENT).
2. `courses`: Thông tin môn học/lớp học.
3. `enrollments`: Bảng trung gian (SV đăng ký Lớp).
4. `sessions`: Các phiên điểm danh (Lưu tọa độ chuẩn của phòng, dải IP chuẩn, thời gian mở/đóng QR).
5. `attendance_records`: Lưu lịch sử quét (Tọa độ thực tế của SV, IP thực tế, Trạng thái: PRESENT, LATE, ABSENT, INVALID_LOCATION).

## 4. Phân công Team & Workflow
Dự án kéo dài 40 ngày, chia làm 3 người:
- **Cường (Backend/DevOps Lead):** Xử lý Database, API Auth, Redis, Thuật toán Haversine (GPS), Websocket Realtime và Deploy.
- **Thư (Frontend Web/BA):** Xử lý Web App cho Admin/Giảng viên (Hiển thị QR máy chiếu, Dashboard báo cáo).
- **Bảo (Frontend Mobile/QA):** Xử lý Web App cho Sinh viên (Tích hợp Camera quét QR, lấy GPS/IP), Test hệ thống.

## 5. Nguyên tắc code cho AI (AI Coding Rules)
Khi tôi yêu cầu bạn (AI) viết code, hãy tuân thủ:
- **Luôn kiểm tra tầng Service:** Không nhồi nhét logic vào Route hoặc Controller.
- **Bảo mật:** Luôn dùng biến môi trường (`process.env`) cho các key nhạy cảm, DB credentials.
- **Clean Code:** Viết code dễ đọc, có comment giải thích cho các thuật toán phức tạp (như Haversine, JWT check).
- **API Response:** Luôn trả về định dạng chuẩn: `{ "status": "...", "message": "...", "data": {...} }`.
- **Tài liệu Task:** Sau khi hoàn thành mỗi Task, BẮT BUỘC tạo file `docs/tasks/README_TXXX.md` (theo cấu trúc chuẩn trong `docs/tasks/README.md`) và cập nhật bảng mục lục trong `docs/tasks/README.md`. Trước khi bắt đầu Task mới, đọc lại các file này để nắm tiến độ và các việc còn tồn đọng.