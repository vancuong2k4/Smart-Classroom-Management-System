# 📋 T006 — Xử lý điểm danh Sinh viên (Student Check-in)

| Thuộc tính | Giá trị |
|---|---|
| **Task ID** | T006 |
| **Stream** | Backend |
| **Epic** | Core Services |
| **Người phụ trách** | Cường (Backend/DevOps Lead) |
| **Trạng thái** | ✅ Hoàn thành |
| **Definition of Done** | Sinh viên có thể gọi API gửi mã QR, toạ độ, IP. Hệ thống kiểm tra khoảng cách và dải IP, phản hồi chính xác và lưu vào DB. |

---

## 1. Mục tiêu
Task này giải quyết trọn vẹn nghiệp vụ **điểm danh chống gian lận** dựa trên 3 lớp bảo mật:
1. **QR Code thay đổi liên tục:** Không thể chụp ảnh gửi về nhà (mã hết hạn sau 15s).
2. **GPS Geofencing:** Không thể điểm danh nếu cách xa bục giảng (ví dụ > 50m).
3. **Mạng IP:** Bắt buộc kết nối vào mạng Wi-Fi nhà trường (kiểm tra dải IP).

## 2. API Reference

### `POST /api/attendance/checkin`
Dành cho Sinh viên (`STUDENT`) sau khi dùng điện thoại quét mã QR.

**Headers:**
- `Authorization: Bearer <token_sinh_vien>`

**Body:**
```json
{
  "token": "d74e8f...",
  "latitude": 21.0285,
  "longitude": 105.8542,
  "ip_address": "192.168.1.15" 
}
```
*(Ghi chú: Tham số `ip_address` trên Body được dùng để dễ test, trong môi trường thật có thể cấu hình lấy trực tiếp từ `req.ip`)*

**Response Thành công (`200 OK`):** Hợp lệ, hoặc Hợp lệ nhưng đi muộn
```json
{
  "status": "success",
  "message": "Điểm danh thành công",
  "data": {
    "status": "PRESENT", // hoặc "LATE"
    "distanceMeters": 12,
    "record": { ... }
  }
}
```

**Response Thất bại (`400 Bad Request` hoặc `403/404`):**
Hệ thống sẽ ném lỗi kèm nguyên nhân, ví dụ:
- *Mã QR không hợp lệ hoặc đã hết hạn* (hết 15s).
- *Phiên điểm danh đã kết thúc.*
- *Bạn không có trong danh sách đăng ký của lớp học này.*
- *Điểm danh thất bại: Bạn cách bục giảng 600m (Cho phép tối đa 50m). Vui lòng di chuyển vào trong lớp.* (Trạng thái `INVALID_LOCATION`).
- *Điểm danh thất bại: Bạn đang không kết nối vào mạng Wi-Fi của trường.*

## 3. Kiến trúc SQL tối ưu
Thay vì kéo toàn bộ toạ độ lên Node.js và tính toán thủ công bằng code JS (Haversine Formula), chúng ta thực thi trực tiếp trên PostgreSQL:
```sql
SELECT 
    ST_DistanceSphere(s.location, ST_SetSRID(ST_MakePoint(lon, lat), 4326)) AS distance_meters,
    (family(ip::inet) = family(s.ip_range) AND ip::inet <<= s.ip_range) AS is_ip_valid
FROM sessions s WHERE s.id = $1
```
Lợi ích:
- Code JS rất gọn gàng.
- PostGIS được viết bằng C nên tính khoảng cách trên mặt cầu trái đất (`ST_DistanceSphere`) chuẩn xác và cực kỳ nhanh.
- Toán tử `<<=` của Postgres kiểm tra subnet IP (CIDR) một cách native, không cần cài thư viện Node.js bên ngoài.

## 4. Xử lý "UPSERT" cho lịch sử điểm danh
Sinh viên khi đứng ngoài hành lang (cách >50m) lỡ quét mã QR -> Trạng thái ghi nhận là `INVALID_LOCATION` (ném lỗi 400).
Sau đó, sinh viên di chuyển vào sát bục giảng (khoảng cách 5m) và quét lại mã QR mới -> Lệnh **UPSERT** (`ON CONFLICT DO UPDATE`) trong SQL sẽ ghi đè record lỗi trước đó, cập nhật toạ độ mới nhất và trạng thái thành `PRESENT`.

## 5. File thay đổi
- `src/models/attendance.model.js` (Query phức tạp với PostGIS)
- `src/services/attendance.service.js` (Luồng xác thực 5 bước)
- `src/controllers/attendance.controller.js`
- `src/routes/attendance.routes.js`
- `src/routes/index.js`
- Cập nhật API `GET /api/sessions/:sessionId` (của Task 05) để trả về thêm mảng `attendance_records` giúp Giảng viên xem được lịch sử ai đang có mặt.

## 6. Lưu ý
Để test trọn vẹn, cần một sinh viên thật (`STUDENT`) được add vào khóa học (thông qua API `POST /api/courses/:id/students` của `T004`).
Sau đó Giảng viên sinh mã, Sinh viên lấy mã gọi API checkin kèm theo toạ độ cách < 50m.
