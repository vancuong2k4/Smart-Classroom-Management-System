import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, RefreshCw, Filter, CheckCircle2, Clock, XCircle, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';

function Statistics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId');

  const [courses, setCourses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(queryCourseId || '');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Tải danh sách khóa học để hiển thị trong bộ lọc & đồng bộ courseId từ query params
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axiosClient.get('/courses');
        const list = res.data?.courses || res.courses || (Array.isArray(res) ? res : []);
        setCourses(list);

        if (queryCourseId) {
          setSelectedClass(queryCourseId);
        } else if (list.length > 0) {
          setSelectedClass(list[0].id.toString());
          setSearchParams({ courseId: list[0].id.toString() });
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách lớp học:', err);
      }
    };
    fetchCourses();
  }, [queryCourseId, setSearchParams]);

  // 2. Gọi API GET: /api/reports/courses/${courseId} để lấy danh sách và thống kê điểm danh thật
  const fetchReport = async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/reports/courses/${courseId}`);
      const data = res.data?.report || res.report || (Array.isArray(res) ? res : []);
      setReportData(data);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo điểm danh:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Không thể tải dữ liệu báo cáo điểm danh.';
      setError(errMsg);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchReport(selectedClass);
    }
  }, [selectedClass]);

  // Xử lý khi người dùng đổi lớp học phần trong dropdown
  const handleClassChange = (e) => {
    const newCourseId = e.target.value;
    setSelectedClass(newCourseId);
    setSearchParams({ courseId: newCourseId });
  };

  // Tính Tỷ lệ Chuyên cần (%)
  const calculateRate = (present, late, total) => {
    if (!total || total === 0) return '0%';
    const rate = (((present + late * 0.5) / total) * 100).toFixed(1);
    return `${rate}%`;
  };

  // 3. Link xuất CSV trỏ trực tiếp đến http://localhost:3000/api/reports/courses/${courseId}/export?token=...
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
  const exportCsvUrl = selectedClass
    ? `http://localhost:3000/api/reports/courses/${selectedClass}/export?token=${encodeURIComponent(token)}`
    : '#';

  // Tổng số buổi học của lớp
  const totalSessions = reportData.length > 0 ? (reportData[0].total_sessions ?? 0) : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header & Nút Thao Tác */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#081c36', margin: '0 0 4px 0' }}>
            Thống kê & Báo cáo Chuyên cần
          </h1>
          <p style={{ fontSize: '13px', color: '#7589a3', margin: 0 }}>
            Dữ liệu tổng hợp tỷ lệ chuyên cần từ cơ sở dữ liệu và tải báo cáo định dạng CSV/Excel.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => fetchReport(selectedClass)}
            style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', color: '#081c36', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <RefreshCw size={16} /> Làm mới
          </button>

          {/* 3. Nút xuất CSV trỏ trực tiếp đến link API Export */}
          <a
            href={exportCsvUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            style={{
              backgroundColor: '#0068ff',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: selectedClass ? 'pointer' : 'not-allowed',
              opacity: selectedClass ? 1 : 0.6,
              boxShadow: '0 4px 12px rgba(0, 104, 255, 0.2)',
            }}
          >
            <Download size={16} /> Tải báo cáo CSV
          </a>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 16px', color: '#ef4444', fontSize: '13px', marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => fetchReport(selectedClass)} style={{ marginLeft: 'auto', background: 'none', border: 'none', textDecoration: 'underline', color: '#ef4444', cursor: 'pointer', fontWeight: '600' }}>
            Thử lại
          </button>
        </div>
      )}

      {/* Lọc theo lớp học phần */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Filter size={18} style={{ color: '#7589a3' }} />
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#081c36' }}>Chọn lớp học phần:</span>
        <select 
          value={selectedClass} 
          onChange={handleClassChange}
          style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e1e4e8', backgroundColor: '#f5f7fb', fontSize: '13px', outline: 'none' }}
        >
          {courses.length > 0 ? (
            courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))
          ) : (
            <option value="1">Lớp học phần (ID: 1)</option>
          )}
        </select>
      </div>

      {/* Bảng Chi tiết Thống kê Điểm danh */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet size={22} style={{ color: '#0068ff' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#081c36', margin: 0 }}>Danh sách Tổng hợp Chuyên cần</h3>
          </div>
          <span style={{ fontSize: '12px', color: '#7589a3' }}>
            Tổng số buổi đã điểm danh: <strong>{totalSessions} buổi</strong>
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0', color: '#0068ff', gap: '10px' }}>
            <Loader2 size={24} className="animate-spin" />
            <span style={{ fontSize: '14px', color: '#7589a3' }}>Đang tải báo cáo từ máy chủ...</span>
          </div>
        ) : reportData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#7589a3', fontSize: '13px' }}>
            Chưa có dữ liệu điểm danh nào cho lớp học phần này.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f7fb', borderBottom: '1px solid #e1e4e8', color: '#081c36', fontWeight: '600' }}>
                  <th style={{ padding: '12px 16px' }}>STT</th>
                  <th style={{ padding: '12px 16px' }}>Mã Sinh Viên (Username)</th>
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
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Lỗi vị trí (Gian lận)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Tỷ lệ Chuyên cần</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => {
                  const present = row.present_count ?? row.present ?? 0;
                  const late = row.late_count ?? row.late ?? 0;
                  const absent = row.absent_count ?? row.absent ?? 0;
                  const invalid = row.invalid_count ?? 0;
                  const total = row.total_sessions ?? row.total ?? 0;
                  const username = row.username || row.mssv;

                  return (
                    <tr key={row.student_id || username || idx} style={{ borderBottom: '1px solid #f0f2f5' }}>
                      <td style={{ padding: '12px 16px', color: '#7589a3' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0068ff' }}>{username}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '500', color: '#081c36' }}>
                        {row.fullName || row.full_name || `Sinh viên ${username}`}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#059669' }}>
                        {present}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#d97706' }}>
                        {late}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#dc2626' }}>
                        {absent}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: invalid > 0 ? '#dc2626' : '#7589a3' }}>
                        {invalid}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#e5efff', color: '#0068ff', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>
                          {calculateRate(present, late, total)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Statistics;