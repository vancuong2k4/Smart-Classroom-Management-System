# Smart Classroom Management System 🎯

Hệ thống điểm danh thông minh chống gian lận bằng cách kết hợp 3 lớp bảo mật: Dynamic QR Code, GPS Location, và Wi-Fi IP.

## 📦 Cấu trúc Repository (Monorepo)
Dự án được cấu trúc theo dạng Monorepo bao gồm các thành phần chính:
- `backend/`: RESTful API Server (Node.js/Express, PostgreSQL, Redis)
- `frontend-web/`: Web App dành cho Admin và Giảng viên (LECTURER)
- `frontend-mobile/`: Mobile App dành cho Sinh viên (STUDENT) để quét QR

## 🚀 Cài đặt & Khởi chạy (Backend)

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```

2. Cài đặt các dependencies:
   ```bash
   npm install
   ```

3. Copy file `.env.example` thành `.env` và cấu hình các biến môi trường:
   ```bash
   cp .env.example .env
   ```

4. Khởi chạy server:
   ```bash
   npm run dev
   ```

## 🛠 Tech Stack
- **Backend**: Node.js (Express), PostgreSQL (PostGIS), Redis
- **Frontend Web**: React / Vue (hoặc theo stack được chọn)
- **Frontend Mobile**: React Native / Flutter (hoặc theo stack được chọn)
- **DevOps**: GitHub Actions (CI/CD cơ bản)

## 📚 Tài liệu
- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md): Bối cảnh, kiến trúc và quy tắc code của dự án
- [docs/tasks/](./docs/tasks/README.md): Nhật ký chi tiết từng Task đã hoàn thành

## 🤝 Thành viên dự án
- **Cường**: Backend/DevOps Lead
- **Thư**: Frontend Web/BA
- **Bảo**: Frontend Mobile/QA
