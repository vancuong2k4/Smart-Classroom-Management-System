# 📋 T008 — Tối ưu Bảo mật & Đóng gói Môi trường Production (Dockerization)

| Thuộc tính | Giá trị |
|---|---|
| **Task ID** | T008 |
| **Stream** | DevOps & Security |
| **Epic** | Production Readiness |
| **Người phụ trách** | Cường (Backend/DevOps Lead) |
| **Trạng thái** | ✅ Hoàn thành |
| **Definition of Done** | API được bảo vệ chống Spam. Toàn bộ hệ thống có thể khởi chạy tự động thông qua `docker-compose up` mà không cần cài đặt môi trường rườm rà. |

---

## 1. Tối ưu Bảo mật (Security & Anti-Spam)
Các thư viện đã được cài đặt và tích hợp vào `src/app.js`:
- **Helmet:** Thêm HTTP Headers chuẩn để phòng chống các lỗ hổng như XSS, Clickjacking, MIME type sniffing.
- **CORS (Cross-Origin Resource Sharing):** Cho phép Frontend và Mobile gọi API, loại bỏ lỗi Policy trên trình duyệt.
- **Express-Rate-Limit:** 
  - *Rate Limit Chung:* Tối đa 150 requests / 15 phút cho mỗi IP.
  - *Rate Limit Điểm danh:* Tối đa 10 requests / 1 phút (Ngăn chặn triệt để hành vi dùng code auto click điểm danh liên tục gây sập Server).

## 2. Dockerization (Đóng gói Hạ tầng)
Việc bàn giao dự án cho Team Frontend giờ đây cực kỳ dễ dàng nhờ `docker-compose.yml`.

### 2.1 Cấu trúc Container
- **Container `smartclass-postgres`**: Chạy PostgreSQL 15, đã cài sẵn `PostGIS 3.3` bên trong để phục vụ việc tính khoảng cách.
- **Container `smartclass-redis`**: Chạy Redis trên Alpine siêu nhẹ để lưu mã QR và pub/sub Websocket.
- **Container `smartclass-backend`**: Build tự động từ thư mục `backend/Dockerfile`. Chứa toàn bộ source code Node.js của dự án.

### 2.2 Luồng tự động hóa
Trong file `docker-compose.yml`, tôi đã thiết lập lệnh khởi động thông minh cho container backend:
```bash
command: sh -c "npx db-migrate up && npm run seed:admin && npm start"
```
Điều này có nghĩa là khi team Frontend gõ `docker-compose up`, hệ thống sẽ tự động tạo bảng (Migration), tự động tạo sẵn tài khoản Admin, và tự động bật Server. Không cần cấu hình hay chạy script bằng tay!

## 3. Cách chạy Môi trường Production
Từ thư mục gốc dự án, chỉ cần một câu lệnh duy nhất:
```bash
docker-compose up -d
```
Hệ thống API sẽ chạy ở `http://localhost:3000`. Cực kỳ chuyên nghiệp và gọn gàng!
