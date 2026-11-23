import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Download, 
  RefreshCw, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileSpreadsheet, 
  Loader2, 
  AlertCircle,
  ShieldAlert,
  CheckSquare,
  Users,
  Calendar,
  Search,
  X,
  MapPin,
  Wifi
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

function Statistics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId');

  const [courses, setCourses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(queryCourseId || '');
  const [reportData, setReportData] = useState([]);
  const [sessionsList, setSessionsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Trạng thái hiển thị Popup Chi tiết Điểm danh từng Buổi học
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [unheldNotice, setUnheldNotice] = useState('');

  // 1. Tải danh sách khóa học để hiển thị trong bộ lọc & đồng bộ courseId từ query params
  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      try {
        const res = await axiosClient.get('/courses');
        const list = res.data?.courses || res?.courses || res.data || (Array.isArray(res) ? res : []);
        if (isMounted) {
          const validCourses = Array.isArray(list) ? list : [];
          setCourses(validCourses);

          if (queryCourseId) {
            setSelectedClass(queryCourseId);
          } else if (validCourses.length > 0) {
            setSelectedClass(validCourses[0].id.toString());
            setSearchParams({ courseId: validCourses[0].id.toString() });
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách lớp học:', err);
      }
    };
    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, [queryCourseId, setSearchParams]);

  // 2. Gọi API GET: /api/reports/courses/${courseId} để lấy danh sách và thống kê điểm danh thật
  const fetchReport = useCallback(async (courseId) => {
    if (!courseId) {
      setReportData([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/reports/courses/${courseId}`);
      const data = res.data?.report || res?.report || res.data || (Array.isArray(res) ? res : []);
      setReportData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo điểm danh:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Không thể tải dữ liệu báo cáo điểm danh.';
      setError(errMsg);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải danh sách các buổi học của lớp học phần
  const fetchSessions = useCallback(async (courseId) => {
    if (!courseId) {
      setSessionsList([]);
      return;
    }
    try {
      const res = await axiosClient.get(`/courses/${courseId}/sessions`);
      const list = res.data?.sessions || res.data?.data?.sessions || (Array.isArray(res.data) ? res.data : []);
      setSessionsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Không thể tải danh sách phiên của lớp:', err);
      setSessionsList([]);
    }
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const loadData = async () => {
        await Promise.all([fetchReport(selectedClass), fetchSessions(selectedClass)]);
      };
      loadData();
    }
  }, [selectedClass, fetchReport, fetchSessions]);

  // Xử lý khi người dùng đổi lớp học phần trong dropdown
  const handleClassChange = (e) => {
    const newCourseId = e.target.value;
    setSelectedClass(newCourseId);
    setSearchParams({ courseId: newCourseId });
  };

  // Tính Tỷ lệ Chuyên cần (%)
  const calculateRate = (present, late, excused, heldCount) => {
    if (!heldCount || heldCount === 0) return '100%';
    const effectivePresent = present + late * 0.5 + excused;
    const rate = Math.min(100, (effectivePresent / heldCount) * 100).toFixed(1);
    return `${rate}%`;
  };

  // 3. Link xuất CSV trỏ trực tiếp đến /api/reports/courses/${courseId}/export?token=...
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
  const exportCsvUrl = selectedClass
    ? `/api/reports/courses/${selectedClass}/export?token=${encodeURIComponent(token)}`
    : '#';

  // Thống kê các chỉ số từ dữ liệu trả về của API Backend
  const totalHeldSessions = reportData.length > 0 ? (reportData[0].held_sessions ?? 0) : 0;
  const totalCourseSessions = reportData.length > 0 ? (reportData[0].total_sessions ?? 15) : 15;
  const maxAllowedAbsences = reportData.length > 0 ? (reportData[0].max_absences ?? 2) : 2;
  const bannedStudentsCount = reportData.filter((r) => r.is_banned).length;

  const selectedCourseObj = courses.find((c) => c.id.toString() === selectedClass);
  const currentCourseName = selectedCourseObj ? `${selectedCourseObj.code} - ${selectedCourseObj.name}` : `Lớp học phần (ID: ${selectedClass})`;

  // Xử lý khi click vào một Buổi học trên Lộ trình tiến độ
  const handleSessionCardClick = async (buoiNum) => {
    const sess = sessionsList.find((s) => Number(s.session_number) === buoiNum);
    if (!sess) {
      setUnheldNotice(`Buổi ${buoiNum} chưa được tổ chức điểm danh.`);
      setTimeout(() => setUnheldNotice(''), 3500);
      return;
    }

    setSelectedSessionDetail({
      buoiNumber: buoiNum,
      session: sess,
      loading: true,
      roster: [],
    });
    setStatusFilter('ALL');
    setSearchKeyword('');

    try {
      const res = await axiosClient.get(`/sessions/${sess.id}`);
      const fullRoster = res.data?.full_roster || res.data?.data?.full_roster || [];
      setSelectedSessionDetail({
        buoiNumber: buoiNum,
        session: res.data?.session || res.data?.data?.session || sess,
        loading: false,
        roster: Array.isArray(fullRoster) ? fullRoster : [],
      });
    } catch (err) {
      console.error('Không thể tải chi tiết điểm danh của buổi:', err);
      setSelectedSessionDetail((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  // Tính toán số liệu thống kê trong Modal của Buổi đang chọn
  const modalRoster = selectedSessionDetail?.roster || [];
  const modalTotal = modalRoster.length;
  const modalPresent = modalRoster.filter((r) => r.status === 'PRESENT').length;
  const modalLate = modalRoster.filter((r) => r.status === 'LATE').length;
  const modalExcused = modalRoster.filter((r) => r.status === 'EXCUSED').length;
  const modalAbsent = modalRoster.filter((r) => r.status === 'ABSENT').length;
  const modalInvalid = modalRoster.filter((r) => r.status === 'INVALID_LOCATION').length;
  const modalPresentRate = modalTotal > 0
    ? Math.round(((modalPresent + modalLate * 0.5 + modalExcused) / modalTotal) * 100)
    : 100;

  // Lọc danh sách sinh viên trong Popup theo Bộ lọc trạng thái & Ô tìm kiếm
  const filteredModalRoster = modalRoster.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      const matchUsername = item.username?.toLowerCase().includes(q);
      const matchName = item.full_name?.toLowerCase().includes(q);
      const matchEmail = item.email?.toLowerCase().includes(q);
      if (!matchUsername && !matchName && !matchEmail) return false;
    }
    return true;
  });

  // Render badge trạng thái chuẩn
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
            <CheckCircle2 size={13} /> Có mặt
          </span>
        );
      case 'LATE':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fffbeb', color: '#d97706', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
            <Clock size={13} /> Đi muộn
          </span>
        );
      case 'EXCUSED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
            <CheckSquare size={13} /> Có phép
          </span>
        );
      case 'INVALID_LOCATION':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fff7ed', color: '#ea580c', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
            <AlertCircle size={13} /> Lỗi vị trí
          </span>
        );
      case 'ABSENT':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fef2f2', color: '#dc2626', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
            <XCircle size={13} /> Vắng K.Phép
          </span>
        );
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1320px', margin: '0 auto' }}>
      {/* Header & Nút Thao Tác */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#081c36', margin: '0 0 4px 0' }}>
            Thống kê & Báo cáo Chuyên cần
          </h1>
          <p style={{ fontSize: '13px', color: '#7589a3', margin: 0 }}>
            Dữ liệu tổng hợp tỷ lệ chuyên cần, cảnh báo cấm thi tự động và xuất báo cáo CSV theo quy chế học vụ.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => {
              fetchReport(selectedClass);
              fetchSessions(selectedClass);
            }}
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
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
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

      {/* Thẻ thống kê nhanh các chỉ số học phần */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#e5efff', color: '#0068ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#7589a3', fontWeight: '500', textTransform: 'uppercase' }}>Sĩ số sinh viên</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#081c36', margin: 0 }}>{reportData.length} SV</h3>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#7589a3', fontWeight: '500', textTransform: 'uppercase' }}>Tiến độ học phần</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#081c36', margin: 0 }}>{totalHeldSessions} / {totalCourseSessions} buổi</h3>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: '600', textTransform: 'uppercase' }}>Vắng tối đa cho phép</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ea580c', margin: 0 }}>{maxAllowedAbsences} buổi</h3>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #fecaca', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600', textTransform: 'uppercase' }}>Sinh viên CẤM THI</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626', margin: 0 }}>{bannedStudentsCount} SV</h3>
          </div>
        </div>
      </div>

      {/* Khung Lộ trình Tiến độ các Buổi học */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: '#0068ff' }} />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#081c36', margin: 0 }}>
              Tiến độ tổ chức các buổi học ({totalHeldSessions}/{totalCourseSessions} buổi)
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: '#7589a3' }}>
            Học phần quy định: <strong>{totalCourseSessions} buổi</strong> (Nhấn vào buổi đã học để xem sổ điểm danh)
          </span>
        </div>

        {/* Thông báo nếu click vào buổi chưa học */}
        {unheldNotice && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', color: '#b45309', fontSize: '13px', marginBottom: '16px' }}>
            <AlertCircle size={16} className="shrink-0" />
            <span>{unheldNotice}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
          {Array.from({ length: totalCourseSessions }, (_, i) => i + 1).map((buoi) => {
            const sess = sessionsList.find((s) => Number(s.session_number) === buoi);
            const isHeld = Boolean(sess);
            const isActive = sess?.status === 'ACTIVE';
            const dateStr = sess?.start_time
              ? new Date(sess.start_time).toLocaleDateString('vi-VN')
              : 'Chưa học';

            return (
              <button
                key={buoi}
                type="button"
                onClick={() => handleSessionCardClick(buoi)}
                title={isHeld ? `Nhấn để xem chi tiết sinh viên có mặt / vắng của Buổi ${buoi}` : `Buổi ${buoi} chưa diễn ra`}
                style={{
                  padding: '12px 8px',
                  borderRadius: '12px',
                  border: isActive
                    ? '2px solid #0068ff'
                    : isHeld
                      ? '1px solid #bbf7d0'
                      : '1px solid #e2e8f0',
                  backgroundColor: isActive
                    ? '#eff6ff'
                    : isHeld
                      ? '#f0fdf4'
                      : '#f8fafc',
                  textAlign: 'center',
                  cursor: isHeld ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  boxShadow: isHeld ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '13px', fontWeight: '700', color: isActive ? '#0068ff' : isHeld ? '#16a34a' : '#64748b', marginBottom: '4px' }}>
                  <span>Buổi {buoi}</span>
                  {isHeld && <span style={{ fontSize: '10px', backgroundColor: isActive ? '#dbeafe' : '#dcfce7', color: isActive ? '#1d4ed8' : '#15803d', padding: '1px 5px', borderRadius: '6px' }}>Xem</span>}
                </div>
                <div style={{ fontSize: '11px', color: isActive ? '#0068ff' : isHeld ? '#15803d' : '#94a3b8', fontWeight: '500' }}>
                  {isActive ? '🔥 Đang mở' : isHeld ? `✓ ${dateStr}` : 'Chưa học'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bảng Chi tiết Thống kê Điểm danh */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet size={22} style={{ color: '#0068ff' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#081c36', margin: 0 }}>Danh sách Tổng hợp Chuyên cần & Điều kiện Thi</h3>
          </div>
          <span style={{ fontSize: '12px', color: '#7589a3' }}>
            Đã diễn ra: <strong>{totalHeldSessions} / {totalCourseSessions} buổi</strong> (Cho phép vắng tối đa: {maxAllowedAbsences} buổi)
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0', color: '#0068ff', gap: '10px' }}>
            <Loader2 size={24} className="animate-spin" />
            <span style={{ fontSize: '14px', color: '#7589a3' }}>Đang tải dữ liệu báo cáo...</span>
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
                  <th style={{ padding: '12px 14px' }}>STT</th>
                  <th style={{ padding: '12px 14px' }}>MSSV / Username</th>
                  <th style={{ padding: '12px 14px' }}>Họ và Tên</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Có mặt
                    </span>
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{ color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> Đi muộn
                    </span>
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckSquare size={14} /> Có phép
                    </span>
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <XCircle size={14} /> Vắng K.Phép
                    </span>
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Lỗi vị trí</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Tỷ lệ Chuyên cần</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', minWidth: '130px' }}>Trạng thái dự thi</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => {
                  const present = row.present_count ?? row.present ?? 0;
                  const late = row.late_count ?? row.late ?? 0;
                  const excused = row.excused_count ?? 0;
                  const absent = row.absent_count ?? row.absent ?? 0;
                  const invalid = row.invalid_count ?? 0;
                  const username = row.username || row.mssv;
                  const isBanned = Boolean(row.is_banned);

                  return (
                    <tr 
                      key={row.student_id || username || idx} 
                      style={{ 
                        borderBottom: '1px solid #f0f2f5',
                        backgroundColor: isBanned ? '#fff5f5' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 14px', color: '#7589a3' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0068ff' }}>{username}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '500', color: '#081c36' }}>
                        {row.fullName || row.full_name || `Sinh viên ${username}`}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600', color: '#059669' }}>
                        {present}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600', color: '#d97706' }}>
                        {late}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600', color: '#2563eb' }}>
                        {excused}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600', color: absent > 0 ? '#dc2626' : '#64748b' }}>
                        {absent}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600', color: invalid > 0 ? '#dc2626' : '#7589a3' }}>
                        {invalid}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#e5efff', color: '#0068ff', padding: '3px 8px', borderRadius: '10px', fontWeight: '700', fontSize: '11px' }}>
                          {calculateRate(present, late, excused, totalHeldSessions)}
                        </span>
                      </td>

                      {/* Trạng thái dự thi: Badge CẤM THI màu đỏ nếu is_banned === true */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {isBanned ? (
                          <span 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              backgroundColor: '#fef2f2', 
                              color: '#dc2626', 
                              border: '1.5px solid #ef4444', 
                              padding: '4px 10px', 
                              borderRadius: '12px', 
                              fontWeight: '800', 
                              fontSize: '11px',
                              boxShadow: '0 1px 4px rgba(220, 38, 38, 0.2)',
                              letterSpacing: '0.5px'
                            }}
                            title={`Vắng không phép (${absent} buổi) vượt quá mức cho phép (${maxAllowedAbsences} buổi)!`}
                          >
                            <ShieldAlert size={13} /> CẤM THI
                          </span>
                        ) : (
                          <span 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              backgroundColor: '#f0fdf4', 
                              color: '#16a34a', 
                              border: '1px solid #bbf7d0', 
                              padding: '3px 8px', 
                              borderRadius: '12px', 
                              fontWeight: '600', 
                              fontSize: '11px' 
                            }}
                          >
                            <CheckCircle2 size={13} /> Đủ điều kiện
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT ĐIỂM DANH TỪNG BUỔI HỌC */}
      {selectedSessionDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 28, 54, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSelectedSessionDetail(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '980px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e1e4e8', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#f8fafc' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ backgroundColor: '#0068ff', color: '#ffffff', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                    Buổi {selectedSessionDetail.buoiNumber}
                  </span>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#081c36', margin: 0 }}>
                    Sổ Điểm danh Chi tiết
                  </h2>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  {currentCourseName} • Diễn ra lúc:{' '}
                  <strong>
                    {selectedSessionDetail.session?.start_time
                      ? new Date(selectedSessionDetail.session.start_time).toLocaleString('vi-VN')
                      : 'Đang cập nhật'}
                  </strong>{' '}
                  • Mã phiên #{selectedSessionDetail.session?.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionDetail(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {selectedSessionDetail.loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px', color: '#0068ff' }}>
                  <Loader2 size={32} className="animate-spin" />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Đang nạp dữ liệu chi tiết buổi học...</span>
                </div>
              ) : (
                <>
                  {/* Thanh Thống kê Nhanh & Bộ Lọc Trạng Thái */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {[
                      { key: 'ALL', label: `Tất cả (${modalTotal})`, bg: '#0068ff', color: '#ffffff', defaultBg: '#f1f5f9', defaultColor: '#475569' },
                      { key: 'PRESENT', label: `Có mặt (${modalPresent})`, bg: '#059669', color: '#ffffff', defaultBg: '#ecfdf5', defaultColor: '#059669' },
                      { key: 'LATE', label: `Đi muộn (${modalLate})`, bg: '#d97706', color: '#ffffff', defaultBg: '#fffbeb', defaultColor: '#d97706' },
                      { key: 'EXCUSED', label: `Có phép (${modalExcused})`, bg: '#2563eb', color: '#ffffff', defaultBg: '#eff6ff', defaultColor: '#2563eb' },
                      { key: 'ABSENT', label: `Vắng K.Phép (${modalAbsent})`, bg: '#dc2626', color: '#ffffff', defaultBg: '#fef2f2', defaultColor: '#dc2626' },
                      { key: 'INVALID_LOCATION', label: `Lỗi vị trí (${modalInvalid})`, bg: '#ea580c', color: '#ffffff', defaultBg: '#fff7ed', defaultColor: '#ea580c' },
                    ].map((btn) => {
                      const isActive = statusFilter === btn.key;
                      return (
                        <button
                          key={btn.key}
                          type="button"
                          onClick={() => setStatusFilter(btn.key)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: 'none',
                            backgroundColor: isActive ? btn.bg : btn.defaultBg,
                            color: isActive ? btn.color : btn.defaultColor,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Thanh Tìm kiếm */}
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="Tìm theo MSSV, Họ và tên hoặc Email..."
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {searchKeyword && (
                      <button
                        type="button"
                        onClick={() => setSearchKeyword('')}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Bảng Danh Sách 100% Sinh Viên */}
                  {filteredModalRoster.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b', fontSize: '13px' }}>
                      Không tìm thấy sinh viên nào phù hợp với bộ lọc.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#334155', fontWeight: '600' }}>
                            <th style={{ padding: '10px 14px', width: '40px' }}>STT</th>
                            <th style={{ padding: '10px 14px' }}>MSSV</th>
                            <th style={{ padding: '10px 14px' }}>Họ và Tên</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '10px 14px' }}>Thời gian quét</th>
                            <th style={{ padding: '10px 14px' }}>Khoảng cách</th>
                            <th style={{ padding: '10px 14px' }}>Mạng (IP)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredModalRoster.map((item, idx) => {
                            const isAbsent = item.status === 'ABSENT';
                            return (
                              <tr
                                key={item.student_id || idx}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  backgroundColor: isAbsent ? '#fffdfd' : 'transparent',
                                }}
                              >
                                <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{idx + 1}</td>
                                <td style={{ padding: '10px 14px', fontWeight: '600', color: '#0068ff' }}>{item.username}</td>
                                <td style={{ padding: '10px 14px', fontWeight: '500', color: '#0f172a' }}>
                                  {item.full_name || `Sinh viên ${item.username}`}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  {renderStatusBadge(item.status)}
                                </td>
                                <td style={{ padding: '10px 14px', color: item.scanned_at ? '#0f172a' : '#94a3b8' }}>
                                  {item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString('vi-VN') : '—'}
                                </td>
                                <td style={{ padding: '10px 14px', color: item.distance_meters !== null ? '#475569' : '#94a3b8' }}>
                                  {item.distance_meters !== null ? `${item.distance_meters}m` : '—'}
                                </td>
                                <td style={{ padding: '10px 14px', color: item.ip_address ? '#475569' : '#94a3b8', fontSize: '12px' }}>
                                  {item.ip_address || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e1e4e8', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>
                Tổng: <strong>{modalTotal} sinh viên</strong> • Tỷ lệ có mặt:{' '}
                <strong style={{ color: '#0068ff' }}>{modalPresentRate}%</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedSessionDetail(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#0068ff',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Statistics;
