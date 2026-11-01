# T014 - Trang chủ và Lịch sử điểm danh

## 1. Bảng thông tin
- Task ID: T014
- Stream: Mobile
- Epic: Ứng dụng sinh viên
- Người phụ trách: Phạm Hoàng Bảo
- Trạng thái: Chờ review
- Definition of Done: Trang chủ hiển thị thông tin tài khoản và môn học từ API; Lịch sử hiển thị kết quả điểm danh, hỗ trợ lọc theo môn và tải lại.

## 2. Mục tiêu
Hoàn thiện Trang chủ và Lịch sử điểm danh, sử dụng dữ liệu từ Backend và JWT đã lưu sau đăng nhập.

## 3. Những gì đã làm
- Trang chủ lấy danh sách môn đã đăng ký qua GET /api/courses.
- Lịch sử lấy dữ liệu cá nhân qua GET /api/reports/me.
- Hiển thị Có mặt, Đi muộn, Vắng, Không hợp lệ vị trí.
- Hiển thị môn học, mã môn, phiên học và thời gian.
- Lọc lịch sử theo môn trên ứng dụng.
- Tải dữ liệu khi mở tab, hỗ trợ kéo xuống tải lại.
- Xử lý đang tải, dữ liệu trống, lỗi kết nối và phiên hết hạn.
- Hủy yêu cầu khi rời tab; giới hạn thời gian chờ 15 giây.
- Chỉ cho tài khoản STUDENT đăng nhập ứng dụng sinh viên.
- Nâng Expo SDK 57 lên 58 và đồng bộ thư viện cho Expo Go.
- Thêm dữ liệu kiểm thử vào database cục bộ.

Các file sửa đổi:
- frontend-mobile/App.tsx
- frontend-mobile/app.json
- frontend-mobile/package.json
- frontend-mobile/package-lock.json

Tài liệu:
- docs/tasks/README_T014.md
- docs/tasks/README.md

## 4. Cách chạy / Cách sử dụng
- Mở Docker Desktop.
- Tại thư mục gốc: docker compose up -d --build backend
- Vào frontend-mobile.
- Cài thư viện theo lockfile: npm ci
- Kiểm tra TypeScript: npx tsc --noEmit
- Kiểm tra môi trường: npx expo-doctor
- Chạy: npx expo start --lan
- Mac và iPhone dùng cùng Wi-Fi, quét QR bằng Expo Go.
- API_URL trong App.tsx phải khớp IP LAN của Mac, cổng 3000.
- Đăng nhập sinh viên, xem Trang chủ và Lịch sử.

## 5. Quyết định kỹ thuật
- Tái sử dụng API Backend hiện có; không sửa logic Backend.
- Đọc JWT từ SecureStore và gửi bằng Authorization: Bearer.
- Dữ liệu môn học và lịch sử được tải từ API, không dùng mock trong app.
- Lọc lịch sử theo môn ở phía ứng dụng sau khi tải dữ liệu.
- Bản ghi không quét được API lịch sử trả về trạng thái ABSENT.

## 6. Kết quả kiểm thử
- Expo Doctor: 20/20 kiểm tra đạt sau nâng SDK.
- TypeScript: npx tsc --noEmit không báo lỗi sau thay file T014.
- Đăng nhập và mở app thành công trên iPhone.
- Trang chủ hiển thị trạng thái chưa đăng ký khi danh sách môn trống.
- Người thực hiện xác nhận đã hiển thị 4 môn từ dữ liệu mẫu web:
  INT3105, INT2204, INT3306, INT3202.
- Lịch sử hiển thị đủ 4 trạng thái với dữ liệu kiểm thử TEST-T014.
- Dữ liệu lịch sử thử gồm 4 buổi từ 20/10/2026 đến 23/10/2026.
- Cần xác nhận thêm thao tác lọc theo môn và kéo xuống tải lại.

## 7. Lưu ý & Việc còn tồn đọng
- [ ] Kiểm thử quét QR thực tế; tab Quét QR vẫn là giao diện chờ.
- [ ] Kiểm thử Android.
- [ ] Kiểm thử thực tế các tình huống token hết hạn và mất mạng.
- [ ] Kiểm tra chi tiết 5 cảnh báo bảo mật npm còn được báo khi cài thư viện.
- [ ] Chuyển API_URL sang cấu hình môi trường khi triển khai.
- [ ] Bổ sung cơ chế tự khôi phục phiên khi mở lại app.
- Dữ liệu kiểm thử được thêm trực tiếp vào database cục bộ, chưa có script seed trong commit.
- Git không lưu dữ liệu database; máy khác cần chuẩn bị dữ liệu riêng.
- Phòng học và lịch học trong mock web chưa được lưu vì bảng courses chưa có các trường đó.
- Các môn mới chưa phân công giảng viên.
- Lịch sử mẫu chỉ kiểm tra lấy và hiển thị dữ liệu, chưa chứng minh luồng QR/GPS/IP.
- Không đưa file sao lưu .bak vào commit.
