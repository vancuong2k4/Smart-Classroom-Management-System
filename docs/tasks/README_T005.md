# 📋 T005 — Phiên điểm danh & Mã QR động (Dynamic QR via WebSockets)

| Thuộc tính | Giá trị |
|---|---|
| **Task ID** | T005 |
| **Stream** | Backend |
| **Epic** | Core Services (API & Realtime) |
| **Người phụ trách** | Cường (Backend/DevOps Lead) |
| **Trạng thái** | ✅ Hoàn thành |
| **Definition of Done** | Giảng viên có thể mở phiên; sinh được mã QR thay đổi liên tục qua Socket.io (lưu bằng Redis); đóng phiên sớm. |

---

## 1. Mục tiêu
- Xây dựng API cốt lõi cho phép giảng viên **Mở phiên điểm danh** cho một môn học cụ thể.
- Phiên lưu lại toạ độ phòng học (dùng kiểu dữ liệu `Point` của PostGIS) và dải IP (dùng `CIDR`).
- Khi phiên mở, dùng **WebSockets (Socket.IO)** để liên tục (10s/lần) đẩy mã QR ngẫu nhiên xuống máy chiếu của giảng viên.

## 2. Thay đổi Database — migration `20261007171500-session-settings`
Cập nhật bảng `sessions` để thêm các config linh hoạt và sử dụng kiểu mạng native:
- Thêm `radius_meters` (bán kính hợp lệ, vd: 50m).
- Thêm `late_after_minutes` (sau N phút tính là đi muộn).
- Thêm `closed_at` (thời điểm đóng sớm).
- Chuyển `ip_range` sang kiểu `CIDR` (để dùng được toán tử `<<=` trong T006).
- Thêm index `(course_id, start_time DESC)`.

## 3. Kiến trúc Redis & Sinh Dynamic QR
- Server có 1 vòng lặp (worker) `setInterval` mỗi 10 giây rà soát tất cả các "phòng" WebSocket đang hoạt động.
- Với mỗi phòng đại diện cho 1 phiên (`session_123`), server sinh 1 mã 16 bytes bằng `crypto.randomBytes(16).toString('hex')`.
- Lưu vào **Redis**: `SETEX qr:<mã> 15 <session_id>`
  - Giải thích số 15: 10 giây (interval) + 5 giây (ân hạn/grace period). 
  - Tại sao cần grace period? Đề phòng trường hợp sinh viên quét mã lúc giây thứ 9.9 nhưng máy yếu mạng chậm mất 1s mới lên server.

## 4. Socket.IO Flow
1. Client (trình duyệt của GV chiếu lên màn hình) kết nối tới `/` bằng WebSockets, truyền token qua `auth.token`.
2. Middleware trên server xác thực JWT, lấy `user.id`.
3. Client `emit('join_session', { sessionId: 123 })`.
4. Server kiểm tra DB xem phiên 123 còn `ACTIVE` không và User này có phải GV của lớp không.
5. Nếu hợp lệ, server đưa client vào `room: session_123` và sinh luôn 1 mã gửi `new_qr`.
6. Sau đó, cứ 10s một lần, phòng sẽ nhận được sự kiện `new_qr` tự động.
7. Nếu phiên hết giờ, server chủ động gửi `session_expired` và kick mọi người khỏi phòng.

## 5. API Reference
| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/courses/:id/sessions` | LECTURER / ADMIN | Mở phiên mới. Yêu cầu Body: `{ latitude: 21.0, longitude: 105.8, ip_range: "192.168.1.0/24" }` (cùng các tuỳ chọn: `radius_meters`, `late_after_minutes`, `duration_minutes`). |
| `GET` | `/api/courses/:id/sessions` | ALL | Lịch sử phiên của một lớp (SV chỉ được xem lịch sử lớp mình có tham gia). |
| `GET` | `/api/sessions/:id` | ALL | Xem thông tin chi tiết một phiên cụ thể. |
| `POST` | `/api/sessions/:id/close` | LECTURER / ADMIN | Đóng sớm một phiên (đánh dấu `closed_at = NOW()`). |

> **Lưu ý chống Race Condition**: API `Mở phiên` sử dụng `SELECT FOR UPDATE` vào bảng `courses` trong một SQL Transaction. Nếu GV vô tình nhấn đúp hoặc gọi API 2 lần cùng 1 lúc, request thứ 2 sẽ bị chặn lại và báo lỗi 409 thay vì tạo ra 2 phiên song song.

## 6. Cách chạy & Kiểm tra
1. Cài Redis server và bật lên ở port 6379 (nếu ở Windows thì dùng Memurai, Docker, hoặc WSL).
2. Chạy `npm run migrate`
3. Mở Terminal chạy: `npm run dev`
4. Có thể dùng Postman để chạy API tạo phiên.
5. Để test WebSocket, có thể dùng một công cụ web (như Socket.io-client) truyền token vào và bắt sự kiện `new_qr`.

## 7. Các file đã tạo / sửa
- Migration: `20261007171500-session-settings.js`
- Utils: `src/utils/network.js`, `src/utils/transaction.js`
- Configs: `src/config/redis.js`, `src/config/session.js`
- Model: `src/models/session.model.js` (dùng PostGIS, `ST_MakePoint`).
- Services: `src/services/session.service.js`, `src/services/qr.service.js`
- Controllers & Routes: `session.controller.js`, `session.routes.js`, nested routes trong `course.routes.js`.
- Websockets: `src/sockets/index.js` (Tích hợp JWT auth và Redis generator).
- Entrypoint: `src/server.js` (Tích hợp socket, redis connect lúc khởi động).

## 8. Việc còn tồn đọng cho các Task sau
- [ ] Xây dựng API điểm danh cho Sinh viên (T006). API này sẽ nhận vào QR token, toạ độ, IP của sinh viên và kiểm tra thuật toán Haversine, subnet.
- [ ] Hiện tại `ip_range` bắt buộc truyền nếu chưa định nghĩa `SCHOOL_IP_RANGE` ở `.env`. Tương lai có thể làm UI trên Frontend để GV cấu hình riêng.
