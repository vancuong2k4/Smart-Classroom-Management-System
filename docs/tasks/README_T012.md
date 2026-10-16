# 📋 T012 — Bảng Thống kê Điểm danh & Xuất file CSV

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Task ID** | T012 |
| **Stream** | Frontend Web / Reports & Export |
| **Module** | Attendance Analytics & Report Export |
| **Epic** | Academic Operations |
| **Người phụ trách** | Thư (Frontend Web Lead) |
| **Trạng thái** | ✅ Hoàn thành (2026-10-16) |
| **Definition of Done** | Hiển thị bảng chỉ số chuyên cần trực quan và xuất file .csv Tiếng Việt chuẩn đọc mượt trên Microsoft Excel. |

---

## 1. Mục tiêu
Cung cấp giao diện tổng hợp chỉ số điểm danh của sinh viên theo từng lớp học phần và tính năng xuất dữ liệu báo cáo ra file Excel/CSV phục vụ công tác chấm điểm chuyên cần cuối kỳ.

---

## 2. Những gì đã làm

### 2.1. Bảng Chỉ Số Chuyên Cần Trực Quan
* **Bộ lọc**: Dropdown chọn lớp học phần cần xem báo cáo.
* **Bảng thống kê chi tiết**:
  * Các cột dữ liệu: STT, Mã Sinh Viên, Họ và Tên.
  * Chỉ số chuyên cần: **Số buổi Có mặt** (xanh lá), **Đi muộn** (vàng), **Vắng mặt** (đỏ).
  * **Tỷ lệ Chuyên cần (%)**: Tự động tính toán theo công thức `(Có mặt + Đi muộn * 0.5) / Tổng buổi * 100`.

### 2.2. Xuất File CSV Chuẩn UTF-8
* Viết hàm `handleExportCSV` khởi tạo Blob dữ liệu CSV.
* **Tích hợp Ký tự BOM UTF-8 (`\uFEFF`)**: Đảm bảo file `.csv` khi tải về máy và mở bằng Microsoft Excel hiển thị đúng Tiếng Việt có dấu 100%, không bị vỡ font.

---

## 3. Cách kiểm tra (Testing)
1. Truy cập `http://localhost:5173/statistics`.
2. Kiểm tra các chỉ số chuyên cần trên bảng.
3. Bấm nút **"Tải báo cáo CSV"** -> Trình duyệt tự động tải file `Bao_Cao_Chuyen_Can_Lop_1_2026.csv`.
4. Mở file bằng Excel -> Dữ liệu tiếng Việt hiển thị sắc nét, không bị lỗi font.