import { useState } from 'react';
import { Download, RefreshCw, Filter, CheckCircle2, Clock, XCircle, FileSpreadsheet } from 'lucide-react';

function Statistics() {
  const [selectedClass, setSelectedClass] = useState('1');

  // Dữ liệu báo cáo điểm danh mẫu
  const reportData = [
    { mssv: '231A010203', fullName: 'Nguyễn Trần Anh Thư', present: 10, late: 1, absent: 0, total: 11 },
    { mssv: '231A010204', fullName: 'Trần Văn Cường', present: 9, late: 0, absent: 2, total: 11 },
    { mssv: '231A010205', fullName: 'Lê Hoàng Nam', present: 11, late: 0, absent: 0, total: 11 },
    { mssv: '231A010206', fullName: 'Phạm Thị Mỹ Duyên', present: 8, late: 2, absent: 1, total: 11 },
  ];

  // Hàm tính Tỷ lệ Chuyên cần (%)
  const calculateRate = (present, late, total) => {
    if (!total) return '0%';
    const rate = (((present + late * 0.5) / total) * 100).toFixed(1);
    return `${rate}%`;
  };

  // Hàm xuất file CSV tiếng Việt chuẩn UTF-8 kèm ký tự BOM (\uFEFF)
  const handleExportCSV = () => {
    const headers = ['STT', 'Mã Sinh Viên', 'Họ và Tên', 'Số buổi Có Mặt', 'Số buổi Đi Muộn', 'Số buổi Vắng', 'Tỷ lệ Chuyên Cần (%)'];
    
    const rows = reportData.map((row, index) => [
      index + 1,
      `"${row.mssv}"`,
      `"${row.fullName}"`,
      row.present,
      row.late,
      row.absent,
      `"${calculateRate(row.present, row.late, row.total)}"`
    ]);

    // Thêm Ký tự BOM (\uFEFF) ở đầu chuỗi giúp Microsoft Excel hiển thị đúng tiếng Việt
    let csvContent = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(rowArray => {
      csvContent += rowArray.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Chuyen_Can_Lop_${selectedClass}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header & Nút Thao Tác */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#081c36', margin: '0 0 4px 0' }}>Thống kê & Báo cáo Chuyên cần</h1>
          <p style={{ fontSize: '13px', color: '#7589a3', margin: 0 }}>Phân tích tỷ lệ điểm danh và xuất báo cáo CSV/Excel cho từng lớp học phần.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', color: '#081c36', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <RefreshCw size={16} /> Làm mới
          </button>
          <button 
            onClick={handleExportCSV}
            style={{ backgroundColor: '#0068ff', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 104, 255, 0.2)' }}
          >
            <Download size={16} /> Tải báo cáo CSV
          </button>
        </div>
      </div>

      {/* Lọc theo lớp học phần */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Filter size={18} style={{ color: '#7589a3' }} />
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#081c36' }}>Chọn lớp học phần:</span>
        <select 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e1e4e8', backgroundColor: '#f5f7fb', fontSize: '13px', outline: 'none' }}
        >
          <option value="1">Lập trình Web nâng cao - Nhóm 01</option>
          <option value="2">Lập trình Windows - Nhóm 02</option>
        </select>
      </div>

      {/* Bảng Chi tiết Thống kê Điểm danh */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet size={22} style={{ color: '#0068ff' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#081c36', margin: 0 }}>Danh sách Tổng hợp Chuyên cần</h3>
          </div>
          <span style={{ fontSize: '12px', color: '#7589a3' }}>Tổng số buổi đã điểm danh: <strong>11 buổi</strong></span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f7fb', borderBottom: '1px solid #e1e4e8', color: '#081c36', fontWeight: '600' }}>
                <th style={{ padding: '12px 16px' }}>STT</th>
                <th style={{ padding: '12px 16px' }}>Mã Sinh Viên</th>
                <th style={{ padding: '12px 16px' }}>Họ và Tên</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Có mặt
                  </span>
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{ color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> Đi muộn
                  </span>
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={14} /> Vắng mặt
                  </span>
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Tỷ lệ Chuyên cần</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, idx) => (
                <tr key={row.mssv} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <td style={{ padding: '12px 16px', color: '#7589a3' }}>{idx + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0068ff' }}>{row.mssv}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#081c36' }}>{row.fullName}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#059669' }}>{row.present}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#d97706' }}>{row.late}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#dc2626' }}>{row.absent}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ backgroundColor: '#e5efff', color: '#0068ff', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>
                      {calculateRate(row.present, row.late, row.total)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Statistics;