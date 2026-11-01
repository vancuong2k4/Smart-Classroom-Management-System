# T016 – GPS và API điểm danh

## Phạm vi
Chuẩn bị vị trí trước khi quét QR và gọi POST /api/attendance/checkin.
Trạng thái: chờ review; đã kiểm thử luồng chính trên iPhone.

## Thay đổi
- Dùng chung cấu hình API trong apiConfig.ts.
- Xin quyền vị trí khi sử dụng ứng dụng.
- Chuẩn bị GPS trước khi mở camera; yêu cầu vị trí mới trong 10 giây
  và độ chính xác được thiết bị báo cáo không quá 50 mét.
- Gửi token QR, latitude, longitude và JWT xác thực.
- Không gửi IP tự khai từ ứng dụng; backend lấy IP từ request.
- Hiển thị kết quả Có mặt hoặc Đi muộn theo phản hồi backend.
- Hiển thị lỗi QR, mạng Wi-Fi hoặc khoảng cách do backend trả về.
- Có rung phản hồi và nút quét mã mới.
- Khi không xác định được kết quả request, hướng dẫn kiểm tra Lịch sử.
- Đồng bộ phiên bản thư viện theo Expo SDK.

## Kiểm thử ngày 30/10/2026
Người thực hiện xác nhận trên iPhone:

| Tình huống | Kết quả |
| --- | --- |
| Chuẩn bị GPS và mở camera | Đạt |
| Phiên thử #6, quét trước ngưỡng đi muộn | PRESENT; hiển thị Có mặt |
| Phiên thử #5, quét sau ngưỡng 10 phút | LATE; hiển thị Đi muộn |
| Phiên thử #7, khoảng cách 212 m, giới hạn 50 m | Bị từ chối; hiển thị khoảng cách |
| QR không hợp lệ hoặc hết hạn | Hiển thị thông báo lỗi |
| Lịch sử điểm danh | Hiển thị đúng kết quả các phiên thử |
| Rung phản hồi | Người thực hiện xác nhận hoạt động |
| TypeScript: npx tsc --noEmit | Không báo lỗi |
| Expo Doctor sau đồng bộ thư viện | 20/20 |
| Mở lại ứng dụng sau cập nhật thư viện | Người thực hiện xác nhận hoạt động |

Đi muộn được tính từ start_time của phiên, không tính từ lúc tạo QR.
Cấu hình QR đã kiểm tra: đổi mã mỗi 10 giây, ân hạn 5 giây;
mỗi token có thời hạn 15 giây. Không thay đổi thời hạn để kiểm thử.

## Giới hạn và kiểm thử tiếp theo
- Docker tại máy kiểm thử nhận IP trung gian 172.18.0.1 thay vì IP LAN
  của điện thoại. Chỉ các phiên TEST-T016 được cấu hình chấp nhận IP này
  để kiểm thử GPS và API. Kết quả này chưa xác minh được mạng Wi-Fi thật.
- Cần kiểm thử IP qua hạ tầng triển khai thực tế; không dùng cấu hình
  IP trung gian của phiên thử làm cấu hình mạng trường.
- Chưa kiểm thử Android, đầy đủ tình huống từ chối/cấp lại quyền,
  mất GPS, mất mạng, timeout và hết hạn đăng nhập.
- Cần kiểm thử tích hợp mã QR động từ giao diện giảng viên/máy chiếu.
- Backend hiện cập nhật bản ghi khi sinh viên quét lại cùng phiên;
  kết quả trước đó có thể bị ghi đè. Cần thống nhất quy tắc với nhóm
  trong kiểm thử tích hợp T017.
- npm còn báo 8 vulnerabilities (5 low, 3 high); chưa xử lý trong T016.
- Dữ liệu phiên thử chỉ nằm trong cơ sở dữ liệu kiểm thử.
  Không đưa token, tọa độ cá nhân hoặc file .bak vào commit.

## Cách chạy
Tại frontend-mobile:
```bash
npm ci
npx expo start --clear --lan
```
Backend, PostgreSQL và Redis cần hoạt động.
Địa chỉ API trong apiConfig.ts phải truy cập được từ điện thoại.
Đăng nhập, chọn Quét QR, chuẩn bị GPS và quét mã của phiên đang mở.
