# 📋 T001 — Khởi tạo Repo và Cấu hình Dự án

| Thuộc tính | Giá trị |
|---|---|
| **Task ID** | T001 |
| **Stream** | DevOps |
| **Module** | setup |
| **Epic** | Project foundation |
| **Người phụ trách** | Cường (Backend/DevOps Lead) |
| **Trạng thái** | ✅ Hoàn thành (2026-10-05) |
| **Definition of Done** | Repo chạy được và có README |

---

## 1. Mục tiêu
Dựng "khung xương" cho toàn bộ dự án: cấu trúc thư mục chung cho 3 thành viên, server Backend chạy được, và CI/CD cơ bản để tự động kiểm tra code khi push.

## 2. Những gì đã làm

### 2.1. Cấu trúc Monorepo
Cả 3 phần (Backend, Web, Mobile) nằm chung một repo để dễ đồng bộ:

```
Smart-Classroom-Management-System/
├── .github/workflows/ci.yml   # CI/CD (GitHub Actions)
├── backend/                   # Cường - Node.js/Express API
├── frontend-web/              # Thư  - Web Admin/Giảng viên (chưa khởi tạo)
├── frontend-mobile/           # Bảo  - Web App Sinh viên (chưa khởi tạo)
├── docs/tasks/                # Tài liệu từng Task (thư mục này)
├── PROJECT_CONTEXT.md         # Bối cảnh & quy tắc dự án
└── README.md                  # Giới thiệu & hướng dẫn chạy
```

### 2.2. Backend skeleton (theo mô hình MVC)
```
backend/src/
├── config/        # Cấu hình (DB, JWT, Redis...)
├── controllers/   # Nhận request -> gọi service -> trả response
├── services/      # ⭐ TOÀN BỘ logic nghiệp vụ nằm ở đây
├── models/        # Truy vấn database (SQL)
├── routes/        # Khai báo endpoint
├── middlewares/   # Auth, xử lý lỗi...
├── app.js         # Cấu hình Express (middleware, routes)
└── server.js      # Điểm khởi động: tạo HTTP server + Socket.IO
```

- **`app.js`** tách riêng khỏi `server.js` → sau này viết test có thể import `app` mà không cần mở port.
- **`server.js`** khởi tạo sẵn **Socket.IO** (chuẩn bị cho tính năng QR realtime).
- Route kiểm tra sức khỏe: `GET /api/health`.

### 2.3. Dependencies đã cài
| Package | Mục đích |
|---|---|
| `express` (v5) | Web framework. Express 5 tự bắt lỗi từ hàm `async` |
| `cors` | Cho phép Frontend gọi API từ domain khác |
| `dotenv` | Đọc biến môi trường từ file `.env` |
| `pg` | Driver PostgreSQL |
| `redis` | Client Redis (dùng cho QR Token TTL 10s - task sau) |
| `socket.io` | Websocket realtime |
| `nodemon` (dev) | Tự restart server khi sửa code |

### 2.4. Biến môi trường
- File mẫu: `backend/.env.example` (được commit lên Git).
- File thật: `backend/.env` (**KHÔNG** commit, đã chặn trong `.gitignore`).

### 2.5. CI/CD — `.github/workflows/ci.yml`
Khi push/PR vào nhánh `main`: checkout code → cài Node 18 → `npm install` trong `backend/` → chạy test.
> Hiện chưa có test nên bước test luôn pass (`|| echo`). Sẽ bổ sung khi có unit test.

## 3. Cách chạy
```bash
cd backend
npm install
cp .env.example .env     # rồi sửa thông tin trong .env
npm run dev              # hoặc: npm start
```
Kiểm tra: mở `http://localhost:3000/api/health` → nhận được:
```json
{ "status": "success", "message": "Server is up and running!", "data": null }
```

## 4. ⚠️ Lưu ý & Việc còn tồn đọng
- [x] **Nhánh Git:** đã đổi `master` → `main` cho khớp với CI (2026-10-06).
- [x] **Commit đầu tiên** đã tạo (2026-10-06). Remote GitHub: `https://github.com/vancuong2k4/Smart-Classroom-Management-System`
- [x] **File `package.json` ở thư mục gốc** (tạo nhầm) → đã xóa (2026-10-06).
- [x] **`.history/`** (do extension *Local History* của VS Code tạo) chứa bản sao file `.env` có mật khẩu DB → đã bổ sung vào `.gitignore` (cập nhật ngày 2026-10-06).
- [ ] `frontend-web/` và `frontend-mobile/` mới chỉ có file `.gitkeep` — chờ Thư và Bảo chọn framework.
