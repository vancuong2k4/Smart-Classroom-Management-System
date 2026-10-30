# T017 – Kiểm thử tích hợp Web và ứng dụng điểm danh

## Phạm vi
Kiểm thử luồng mở phiên trên Web, hiển thị QR động, quét bằng iPhone,
ghi nhận điểm danh, xem lịch sử và kết thúc phiên.

Trạng thái: đã kiểm thử luồng chính tại máy phát triển; chờ review.
Ngày kiểm thử: 30/10/2026.
Người thực hiện: Phạm Hoàng Bảo.

## Thay đổi
- Thay tọa độ và mạng IP cố định trong QRProjector bằng các ô nhập.
- Cho phép cấu hình vĩ độ, kinh độ, mạng IP/CIDR và bán kính lớp.
- Kiểm tra tọa độ hợp lệ và bán kính từ 10 đến 1000 mét.
- Yêu cầu nhập mạng IP; chặn dải /0 tại giao diện.
- Khóa các ô cấu hình vị trí khi đang mở phiên hoặc gửi yêu cầu.
- Không đưa tọa độ cá nhân hoặc cấu hình IP thử nghiệm vào mã nguồn.

## Kết quả kiểm thử
Các kết quả thao tác được người thực hiện xác nhận trên Web và iPhone.

| Tình huống | Kết quả |
| --- | --- |
| Mở phiên từ Web với cấu hình được nhập | Đạt; tạo phiên #8 |
| Hiển thị QR động và tự đổi mã | Người thực hiện xác nhận đạt |
| Quét QR trên Web bằng ứng dụng iPhone | Đạt; hiển thị Có mặt |
| Danh sách điểm danh cập nhật realtime | Người thực hiện xác nhận đạt |
| Kết thúc phiên trên Web | Người thực hiện xác nhận đạt; QR biến mất |
| Xem lịch sử phiên #8 trên iPhone | Người thực hiện xác nhận đạt |
| npm run build tại frontend-web | Đạt |
| git diff --check | Không báo lỗi |

Các ca Có mặt, Đi muộn, QR hết hạn và ngoài phạm vi đã được ghi
trong README_T016.md. Đây là kết quả của đợt kiểm thử trước,
không thay thế kiểm thử lại đầy đủ trong T017.

## Giới hạn và việc cần kiểm thử tiếp
- Web được kiểm thử bằng tài khoản ADMIN; chưa xác minh riêng quyền LECTURER.
- Docker nhận IP trung gian. Phiên thử sử dụng cấu hình IP riêng để
  kiểm thử GPS và API; chưa xác minh mạng Wi-Fi trường trong thực tế.
- Chưa kiểm thử Android, nhiều sinh viên quét đồng thời, Fake GPS,
  chia sẻ QR và chuyển giữa Wi-Fi với dữ liệu di động.
- Chưa kiểm thử đầy đủ mất mạng, kết nối lại Socket.IO, tải lại trang,
  tự hết thời gian phiên và quét lại QR sau khi đóng phiên.
- Cần thống nhất quy tắc quét lại cùng phiên: backend hiện có thể cập nhật
  bản ghi cũ, làm thay đổi trạng thái và thời điểm điểm danh.
- Chưa xác minh báo cáo/thống kê sau khi kết thúc phiên.
- Chặn /0 ở giao diện không thay thế kiểm tra chính sách tại backend.

## Chạy kiểm tra
Tại thư mục frontend-web: npm run build.
Tại thư mục gốc: git diff --check.

## Quản lý mã nguồn
Tiếp tục làm việc trên nhánh bao/frontend-mobile.
Không đưa file .bak, token, mật khẩu hoặc dữ liệu vị trí cá nhân vào commit.
