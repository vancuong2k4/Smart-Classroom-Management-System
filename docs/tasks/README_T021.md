# README_T021 — Frontend Mobile: Khóa Thiết Bị (Device Binding) & Đơn Xin Nghỉ Phép Trực Tuyến

## 1. Bảng Thông Tin

| Thuộc tính | Chi tiết |
|---|---|
| **Task ID** | T021 |
| **Stream** | Frontend Mobile / Student App / Expo React Native |
| **Epic** | Chống Gian Lận Điểm Danh Bằng Thiết Bị & Quản Lý Đơn Nghỉ Phép Sinh Viên |
| **Người phụ trách** | Hoàng Bảo (Mobile / QA Lead) |
| **Trạng thái** | ✅ Hoàn thành (0 TypeScript Error, Expo Doctor 20/20 Passed) |
| **Definition of Done** | - Thu thập định danh phần cứng duy nhất (`deviceId`) trên thiết bị di động (Android & iOS).<br>- Tích hợp gửi `deviceId` trong payload điểm danh `POST /api/attendance/checkin`.<br>- Hiển thị Dialog cảnh báo đỏ khi server trả về HTTP 403 do xung đột thiết bị.<br>- Màn hình gửi đơn xin nghỉ phép trực tuyến (`LeaveRequestsScreen.tsx`): Chọn môn học, chọn ngày (DatePicker), nhập lý do, đính kèm ảnh minh chứng qua Camera/Album (nén Base64).<br>- Màn hình Lịch sử đơn: Hiển thị trạng thái duyệt (`PENDING`, `APPROVED`, `REJECTED`) và ghi chú phản hồi của Giảng viên (`review_note`).<br>- Tích hợp tab "Đơn nghỉ" vào thanh điều hướng Bottom Navigation và lối tắt tại `HomeScreen`. |

---

## 2. Mục Tiêu

1. **Khóa 1 tài khoản trên 1 thiết bị (Device Binding):** Ngăn chặn triệt để tình trạng điểm danh hộ. Khi sinh viên quét mã QR điểm danh, ứng dụng tự động lấy mã phần cứng (`deviceId`) gửi kèm lên backend. Nếu tài khoản đã liên kết với máy khác, ứng dụng lập tức bật Modal cảnh báo đỏ viền `#E5484D` có icon ổ khóa thông báo sinh viên liên hệ Giảng viên/Quản trị viên để đổi thiết bị.
2. **Nộp đơn xin nghỉ phép trực tuyến (`/leave-requests`):** Sinh viên có thể chủ động nộp đơn nghỉ học ngay trên điện thoại: chọn môn đang học từ danh sách, chọn ngày nghỉ qua bộ chọn lịch, nhập lý do chi tiết và chụp ảnh giấy khám bệnh/giấy phép từ máy ảnh hoặc album ảnh.
3. **Theo dõi trạng thái & phản hồi của Giảng viên:** Cung cấp màn hình lịch sử đơn cho phép sinh viên theo dõi tiến độ duyệt đơn real-time và đọc được lời dặn hoặc lý do từ chối của giảng viên (`review_note`).

---

## 3. Những Gì Đã Làm (Files & Modifications)

### A. Quản Lý Thiết Bị & Điểm Danh
- [`frontend-mobile/useAttendanceCheckin.ts`](file:///frontend-mobile/useAttendanceCheckin.ts):
  - Viết hàm `getDeviceId()` tích hợp `expo-application`: lấy `Application.getAndroidId()` trên Android và `Application.getIosIdForVendorAsync()` trên iOS.
  - Gửi kèm `deviceId` trong payload `POST /api/attendance/checkin`.
  - Bắt lỗi HTTP 403 khi xung đột thiết bị bằng regex `/thiết bị/i.test(body.message)` và kích hoạt cờ `deviceMismatch: true`.
- [`frontend-mobile/QRScannerScreen.tsx`](file:///frontend-mobile/QRScannerScreen.tsx):
  - Thiết kế component `<Modal>` cảnh báo đỏ chuyên dụng: hiển thị icon ổ khóa đỏ, tiêu đề "Thiết bị không hợp lệ", thông báo hướng dẫn và nút "Đã hiểu" đưa camera về trạng thái sẵn sàng quét tiếp.

### B. Module Đơn Xin Nghỉ Phép Sinh Viên
- [`frontend-mobile/LeaveRequestsScreen.tsx`](file:///frontend-mobile/LeaveRequestsScreen.tsx):
  - Màn hình tích hợp 2 tab Segmented: "Gửi đơn" và "Lịch sử đơn".
  - *Gửi đơn:* Dropdown chọn môn học dùng `<ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">` cuộn mượt mà; DatePicker chọn ngày qua `@react-native-community/datetimepicker`; trường nhập lý do có bộ đếm ký tự (tối đa 1000); đính kèm ảnh minh chứng qua `expo-image-picker` hỗ trợ cả Camera và Thư viện ảnh kèm cơ chế nén ảnh Base64 dưới 2MB.
  - *Lịch sử đơn:* Hiển thị danh sách các đơn đã gửi kèm badge trạng thái màu sắc (`PENDING` - Vàng, `APPROVED` - Xanh, `REJECTED` - Đỏ), hiển thị phản hồi từ giảng viên (`review_note`), hỗ trợ kéo để tải lại (Pull-to-refresh).
- [`frontend-mobile/App.tsx`](file:///frontend-mobile/App.tsx):
  - Thêm tab "Đơn nghỉ" với biểu tượng `document-text` vào `BottomTabNavigator`.
  - Bổ sung nút tắt nhanh "Gửi đơn xin nghỉ phép" ngay trên `HomeScreen`.
- [`frontend-mobile/app.json`](file:///frontend-mobile/app.json):
  - Khai báo plugin `expo-image-picker` kèm mô tả quyền truy cập ảnh `photosPermission` và plugin `@react-native-community/datetimepicker`.
- [`frontend-mobile/package.json`](file:///frontend-mobile/package.json):
  - Cập nhật các thư viện Expo tương thích: `expo-application`, `expo-image-picker`, `@react-native-community/datetimepicker`.
