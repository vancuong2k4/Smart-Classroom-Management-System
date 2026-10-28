# T015 — Camera và trình quét mã QR

## 1. Thông tin
- Người thực hiện: Phạm Hoàng Bảo
- Stream: Frontend Mobile / Hardware Integration
- Trạng thái: Chờ review

## 2. Mục tiêu
Xin quyền camera, hiển thị màn quét có khung ngắm và đọc nội dung mã QR.

## 3. Đã thực hiện
- Tích hợp expo-camera và cấu hình quyền camera.
- Kết nối tab Quét QR với QRScannerScreen.
- Thiết kế giao diện đồng bộ tông xanh của ứng dụng.
- Hiển thị thông báo cấp quyền, lỗi và kết quả ở giữa màn hình.
- Chặn nhận mã lặp sau khi đã quét; hỗ trợ Quét lại.
- Gỡ camera khi rời tab hoặc ứng dụng chuyển ra nền.
- Kiểm tra lại quyền khi quay về ứng dụng từ cài đặt.

## 4. File thay đổi
- frontend-mobile/QRScannerScreen.tsx
- frontend-mobile/App.tsx
- frontend-mobile/app.json
- frontend-mobile/package.json
- frontend-mobile/package-lock.json
- docs/tasks/README_T015.md
- docs/tasks/README.md

## 5. Cách chạy
Trong frontend-mobile:
- npm ci
- npx expo start --clear --lan

Mở ứng dụng trên điện thoại, đăng nhập và chọn Quét QR.
Backend cần hoạt động để đăng nhập.

Tạo QR thử trên Mac:
npx --yes qrcode "SMARTCLASS-T015-TEST"

## 6. Kết quả kiểm thử
Người thực hiện xác nhận trên iPhone:
- Camera hiển thị và giao diện đạt yêu cầu.
- Đọc đúng chuỗi SMARTCLASS-T015-TEST.
- Quét lại hoạt động.
- Chuyển tab và quay lại hoạt động.
- Đưa ứng dụng ra nền rồi mở lại hoạt động.

## 7. Giới hạn và việc còn lại
- Chưa kiểm thử QR thật từ màn hình giảng viên hoặc máy chiếu.
- Chưa kiểm thử Android.
- Cần kiểm thử đầy đủ từ chối quyền và cấp lại quyền trong cài đặt.
- Khung ngắm chỉ hướng dẫn vị trí; không giới hạn vùng nhận diện.
- Đọc được QR không đồng nghĩa token hợp lệ hoặc đã điểm danh.
- GPS và gửi API check-in thuộc T016.
- Không đưa file sao lưu .bak vào commit.
