import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Loader2, 
  Image as ImageIcon, 
  X, 
  ExternalLink,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

function LeaveRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId');

  // Danh sách lớp học và lớp đang chọn
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(queryCourseId || '');

  // Danh sách đơn nghỉ phép và trạng thái tải
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Bộ lọc trạng thái ('' = Tất cả, 'PENDING', 'APPROVED', 'REJECTED')
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Quản lý ghi chú duyệt theo từng ID đơn (id -> string)
  const [reviewNotes, setReviewNotes] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal xem ảnh minh chứng phóng to
  const [enlargedImage, setEnlargedImage] = useState(null);

  // 1. Tải danh sách khóa học để hiển thị trong dropdown & đồng bộ courseId từ query params
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
            setSelectedCourseId(queryCourseId);
          } else if (validCourses.length > 0) {
            const firstId = validCourses[0].id.toString();
            setSelectedCourseId(firstId);
            setSearchParams({ courseId: firstId });
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

  // 2. Tải danh sách đơn xin nghỉ phép của lớp được chọn qua API GET /api/leave-requests/course/:courseId
  const fetchLeaveRequests = useCallback(async (courseId) => {
    if (!courseId) {
      setLeaveRequests([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/leave-requests/course/${courseId}`);
      const list = res.data?.leaveRequests || res.leaveRequests || res.data || (Array.isArray(res) ? res : []);
      setLeaveRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách đơn nghỉ phép:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Không thể tải danh sách đơn nghỉ phép của lớp này.';
      setError(msg);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Gọi fetchLeaveRequests khi selectedCourseId thay đổi
  useEffect(() => {
    let isMounted = true;
    const loadRequests = async () => {
      if (selectedCourseId) {
        if (isMounted) {
          await fetchLeaveRequests(selectedCourseId);
        }
      } else {
        await Promise.resolve();
        if (isMounted) {
          setLeaveRequests([]);
        }
      }
    };

    loadRequests();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId, fetchLeaveRequests]);

  // Tự động ẩn thông báo thành công sau 4 giây
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Xử lý khi đổi lớp học phần
  const handleCourseChange = (e) => {
    const newId = e.target.value;
    setSelectedCourseId(newId);
    setSearchParams({ courseId: newId });
  };

  // Cập nhật giá trị ghi chú duyệt cho một đơn cụ thể
  const handleNoteChange = (requestId, value) => {
    setReviewNotes((prev) => ({
      ...prev,
      [requestId]: value,
    }));
  };

  // 3. Phê duyệt / Từ chối đơn: PATCH /api/leave-requests/:id
  const handleReview = async (requestId, status) => {
    const actionLabel = status === 'APPROVED' ? 'Duyệt (Cho phép nghỉ)' : 'Từ chối';
    const note = reviewNotes[requestId] || '';

    const confirmed = window.confirm(`Bạn có chắc chắn muốn ${actionLabel} cho đơn này?`);
    if (!confirmed) return;

    setActionLoadingId(requestId);
    setError('');
    try {
      await axiosClient.patch(`/leave-requests/${requestId}`, {
        status,
        reviewNote: note.trim() || null,
        review_note: note.trim() || null,
      });

      setSuccessMessage(`${actionLabel} đơn xin nghỉ phép thành công!`);
      // Xóa ghi chú đã nhập sau khi hoàn tất
      setReviewNotes((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      // Tải lại danh sách đơn để cập nhật trạng thái mới nhất
      await fetchLeaveRequests(selectedCourseId);
    } catch (err) {
      console.error('Lỗi khi xét duyệt đơn:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Không thể cập nhật trạng thái đơn!';
      alert(`Thao tác thất bại: ${msg}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Lọc danh sách theo trạng thái và tìm kiếm
  const filteredRequests = leaveRequests.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.student_full_name || '').toLowerCase().includes(q);
      const matchUser = (item.student_username || '').toLowerCase().includes(q);
      const matchReason = (item.reason || '').toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchReason) return false;
    }
    return true;
  });

  // Thống kê nhanh số lượng
  const totalCount = leaveRequests.length;
  const pendingCount = leaveRequests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = leaveRequests.filter((r) => r.status === 'REJECTED').length;

  const currentCourse = courses.find((c) => c.id.toString() === selectedCourseId);

  // Định dạng hiển thị ngày YYYY-MM-DD -> DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1320px', margin: '0 auto' }}>
      {/* 1. Tiêu đề trang & Thanh chọn lớp */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#081c36', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={26} color="#0068ff" /> Xét Duyệt Đơn Xin Nghỉ Phép
          </h1>
          <p style={{ fontSize: '13px', color: '#7589a3', margin: 0 }}>
            Tiếp nhận và xét duyệt đơn vắng học có lý do của sinh viên. Đơn được duyệt sẽ tự động cập nhật sang trạng thái nghỉ có phép (EXCUSED).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Nút Làm mới */}
          <button
            onClick={() => fetchLeaveRequests(selectedCourseId)}
            disabled={loading || !selectedCourseId}
            title="Tải lại danh sách"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #e1e4e8',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              cursor: selectedCourseId ? 'pointer' : 'not-allowed',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>

          {/* Dropdown Chọn lớp học phần */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '12px', border: '1px solid #e1e4e8', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <BookOpen size={16} style={{ color: '#0068ff' }} />
            <select
              value={selectedCourseId}
              onChange={handleCourseChange}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '13px',
                fontWeight: '600',
                color: '#081c36',
                outline: 'none',
                cursor: 'pointer',
                maxWidth: '260px',
              }}
            >
              {courses.length === 0 ? (
                <option value="">-- Chưa có lớp học --</option>
              ) : (
                courses.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.code} - {c.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Banner thông báo thành công hoặc lỗi */}
      {successMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', color: '#16a34a', fontSize: '13px', marginBottom: '20px' }}>
          <CheckCircle2 size={18} className="shrink-0" />
          <span style={{ fontWeight: '500' }}>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 16px', color: '#ef4444', fontSize: '13px', marginBottom: '20px' }}>
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
          <button onClick={() => fetchLeaveRequests(selectedCourseId)} style={{ marginLeft: 'auto', background: 'none', border: 'underline', color: '#ef4444', cursor: 'pointer', fontWeight: '600' }}>
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Thẻ thống kê số lượng đơn */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#e5efff', color: '#0068ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#7589a3', fontWeight: '500', textTransform: 'uppercase' }}>Tổng số đơn</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#081c36', margin: 0 }}>{totalCount}</h3>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: '600', textTransform: 'uppercase' }}>Đang chờ duyệt</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ea580c', margin: 0 }}>{pendingCount}</h3>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', textTransform: 'uppercase' }}>Đã phê duyệt</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a', margin: 0 }}>{approvedCount}</h3>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #fecaca', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600', textTransform: 'uppercase' }}>Đã từ chối</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626', margin: 0 }}>{rejectedCount}</h3>
          </div>
        </div>
      </div>

      {/* 4. Bộ lọc trạng thái & Thanh tìm kiếm */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Tabs bộ lọc trạng thái */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#7589a3', marginRight: '4px' }}>Trạng thái:</span>
            {[
              { label: 'Tất cả', value: '' },
              { label: 'Chờ duyệt', value: 'PENDING' },
              { label: 'Đã duyệt', value: 'APPROVED' },
              { label: 'Từ chối', value: 'REJECTED' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                style={{
                  border: 'none',
                  backgroundColor: statusFilter === tab.value ? '#0068ff' : '#f1f5f9',
                  color: statusFilter === tab.value ? '#ffffff' : '#475569',
                  borderRadius: '10px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ô tìm kiếm sinh viên hoặc lý do */}
          <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo MSSV, tên, lý do xin nghỉ..."
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* 5. Bảng hiển thị danh sách đơn xin nghỉ phép */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e1e4e8', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#081c36', margin: 0 }}>
            Lớp học: {currentCourse ? `${currentCourse.code} - ${currentCourse.name}` : 'Chưa chọn lớp'}
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Hiển thị <strong>{filteredRequests.length}</strong> đơn xin phép
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e1e4e8', color: '#475569', fontWeight: '600' }}>
                <th style={{ padding: '14px 16px', width: '50px' }}>STT</th>
                <th style={{ padding: '14px 16px' }}>Sinh viên</th>
                <th style={{ padding: '14px 16px', minWidth: '110px' }}>Ngày xin nghỉ</th>
                <th style={{ padding: '14px 16px', minWidth: '220px' }}>Lý do xin nghỉ</th>
                <th style={{ padding: '14px 16px', minWidth: '120px' }}>Minh chứng</th>
                <th style={{ padding: '14px 16px', minWidth: '120px' }}>Trạng thái</th>
                <th style={{ padding: '14px 16px', minWidth: '320px' }}>Xét duyệt & Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 0', textAlign: 'center', color: '#0068ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={22} className="animate-spin" />
                      <span>Đang tải danh sách đơn xin nghỉ phép...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#7589a3' }}>
                    <ClipboardList size={36} style={{ margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                    <p style={{ margin: 0, fontWeight: '500' }}>Không có đơn xin nghỉ phép nào phù hợp với bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req, idx) => {
                  const isPending = req.status === 'PENDING';
                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';
                  const isBusy = actionLoadingId === req.id;

                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top', transition: 'background-color 0.15s ease' }}>
                      {/* STT */}
                      <td style={{ padding: '14px 16px', color: '#7589a3' }}>{idx + 1}</td>

                      {/* Sinh viên */}
                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          <span style={{ fontWeight: '600', color: '#081c36', display: 'block' }}>
                            {req.student_full_name || '(Chưa đặt tên)'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#0068ff', fontFamily: 'monospace', fontWeight: '600' }}>
                            MSSV: {req.student_username}
                          </span>
                          {req.student_email && (
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                              {req.student_email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ngày xin nghỉ */}
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#081c36' }}>
                        {formatDate(req.requested_date)}
                      </td>

                      {/* Lý do */}
                      <td style={{ padding: '14px 16px', color: '#334155' }}>
                        <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', lineHeight: 1.5 }}>
                          {req.reason}
                        </div>
                      </td>

                      {/* Ảnh minh chứng đính kèm */}
                      <td style={{ padding: '14px 16px' }}>
                        {req.proof_image_url ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div 
                              onClick={() => setEnlargedImage({
                                url: req.proof_image_url,
                                studentName: req.student_full_name,
                                studentUser: req.student_username,
                                date: formatDate(req.requested_date),
                                reason: req.reason,
                              })}
                              style={{ 
                                width: '64px', 
                                height: '64px', 
                                borderRadius: '10px', 
                                overflow: 'hidden', 
                                border: '1px solid #cbd5e1', 
                                cursor: 'pointer', 
                                position: 'relative',
                                backgroundColor: '#f1f5f9'
                              }}
                              title="Bấm để xem ảnh phóng to"
                            >
                              <img
                                src={req.proof_image_url}
                                alt="Minh chứng"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentNode.innerHTML = '<span style="font-size:10px;padding:4px;display:block;color:#94a3b8">Lỗi ảnh</span>';
                                }}
                              />
                            </div>
                            <button
                              onClick={() => setEnlargedImage({
                                url: req.proof_image_url,
                                studentName: req.student_full_name,
                                studentUser: req.student_username,
                                date: formatDate(req.requested_date),
                                reason: req.reason,
                              })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'none',
                                border: 'none',
                                color: '#0068ff',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              <ImageIcon size={12} /> Xem phóng to
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Không đính kèm
                          </span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td style={{ padding: '14px 16px' }}>
                        {isPending && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>
                            <Clock size={12} /> Chờ duyệt
                          </span>
                        )}
                        {isApproved && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>
                            <CheckCircle2 size={12} /> Đã duyệt
                          </span>
                        )}
                        {isRejected && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>
                            <XCircle size={12} /> Từ chối
                          </span>
                        )}
                      </td>

                      {/* Thao tác xét duyệt & Ghi chú */}
                      <td style={{ padding: '14px 16px' }}>
                        {isPending ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ position: 'relative' }}>
                              <MessageSquare size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                              <input
                                type="text"
                                placeholder="Ghi chú phản hồi (Tùy chọn)..."
                                value={reviewNotes[req.id] || ''}
                                onChange={(e) => handleNoteChange(req.id, e.target.value)}
                                style={{
                                  width: '100%',
                                  paddingLeft: '32px',
                                  paddingRight: '10px',
                                  paddingTop: '7px',
                                  paddingBottom: '7px',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#f8fafc',
                                  fontSize: '12px',
                                  outline: 'none',
                                }}
                              />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleReview(req.id, 'APPROVED')}
                                disabled={isBusy}
                                title="Chấp nhận đơn xin nghỉ phép"
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '7px 12px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  opacity: isBusy ? 0.7 : 1,
                                  transition: 'background-color 0.2s',
                                }}
                              >
                                {isBusy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Duyệt
                              </button>

                              <button
                                onClick={() => handleReview(req.id, 'REJECTED')}
                                disabled={isBusy}
                                title="Từ chối đơn xin nghỉ phép"
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  backgroundColor: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  opacity: isBusy ? 0.7 : 1,
                                }}
                              >
                                <XCircle size={14} />
                                Từ chối
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#475569', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <div>
                              <strong>Ghi chú:</strong> {req.review_note || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không có</span>}
                            </div>
                            {req.reviewer_username && (
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                                Người duyệt: @{req.reviewer_username}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. MODAL XEM ẢNH MINH CHỨNG PHÓNG TO                       */}
      {/* ========================================================= */}
      {enlargedImage && (
        <div 
          onClick={() => setEnlargedImage(null)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1100, 
            padding: '20px' 
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '20px', 
              padding: '20px', 
              maxWidth: '800px', 
              width: '100%', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#081c36', margin: 0 }}>
                  Ảnh Minh Chứng Nghỉ Phép
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                  Sinh viên: <strong>{enlargedImage.studentName}</strong> ({enlargedImage.studentUser}) • Ngày: {enlargedImage.date}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={enlargedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#f1f5f9',
                    color: '#0068ff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} /> Mở tab mới
                </a>
                <button
                  onClick={() => setEnlargedImage(null)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', textAlign: 'center', backgroundColor: '#0f172a', borderRadius: '12px', padding: '12px' }}>
              <img
                src={enlargedImage.url}
                alt="Minh chứng phóng to"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>

            <div style={{ marginTop: '12px', fontSize: '12px', color: '#334155', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <strong>Lý do xin nghỉ:</strong> {enlargedImage.reason}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveRequests;
