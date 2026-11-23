import { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Play, Square, RefreshCw, Clock, ShieldCheck, Users, CheckCircle, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import axiosClient from '../api/axiosClient';

function QRProjector() {
  const [courses, setCourses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSessionNumber, setSelectedSessionNumber] = useState(1);
  const [courseSessions, setCourseSessions] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [qrToken, setQrToken] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(15 * 60);
  const [scannedStudents, setScannedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [conflictSessionId, setConflictSessionId] = useState(null);

  // Tọa độ GPS tự động từ trình duyệt & Bán kính điểm danh
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('50');

  const socketRef = useRef(null);

  // Lấy vị trí GPS hiện tại từ Geolocation API của trình duyệt
  const fetchBrowserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ Geolocation (định vị GPS).');
      return;
    }

    setLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy || 0);
        setCoords({ latitude: lat, longitude: lng, accuracy: acc });
        setLocating(false);
        setLocationError('');
      },
      (err) => {
        let msg = 'Không thể lấy vị trí hiện tại.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Trình duyệt bị từ chối quyền truy cập Vị trí. Vui lòng cho phép quyền Vị trí (Location) trong cài đặt trình duyệt để mở phiên điểm danh!';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'Tín hiệu GPS/Vị trí không khả dụng. Vui lòng kiểm tra lại thiết bị hoặc kết nối.';
            break;
          case err.TIMEOUT:
            msg = 'Thời gian lấy tọa độ vị trí đã quá hạn. Vui lòng thử lại!';
            break;
          default:
            msg = err.message || msg;
        }
        setLocationError(msg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Tự động lấy vị trí khi component mount
  useEffect(() => {
    let isMounted = true;
    const initLocation = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchBrowserLocation();
      }
    };
    initLocation();
    return () => {
      isMounted = false;
    };
  }, [fetchBrowserLocation]);

  // 1. Tải danh sách lớp học thật của giảng viên từ Database khi mở trang
  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      try {
        const response = await axiosClient.get('/courses');
        const courseList = response.data?.courses || response?.courses || response.data || (Array.isArray(response) ? response : []);
        if (isMounted) {
          const valid = Array.isArray(courseList) ? courseList : [];
          setCourses(valid);
          if (valid.length > 0) {
            setSelectedClass(valid[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Không thể tải danh sách khóa học:', err);
      }
    };
    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  // Tải danh sách điểm danh chi tiết của một phiên
  const fetchSessionRecords = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await axiosClient.get(`/sessions/${sessionId}`);
      const records = res.data?.attendance_records || res.data?.data?.attendance_records || [];
      if (Array.isArray(records)) {
        setScannedStudents(
          records.map((r) => ({
            username: r.username,
            studentId: r.student_id,
            scannedAt: r.created_at,
            distanceMeters: r.lat !== undefined ? Math.round(r.distance_meters || 0) : undefined,
            status: r.status,
          }))
        );
      }
    } catch (err) {
      console.warn('Không thể tải danh sách điểm danh của phiên:', err);
    }
  }, []);

  // Kết nối Socket.io với phiên điểm danh
  const connectSessionSocket = useCallback((sessionId) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Đã kết nối tới server:', socket.id);
      socket.emit('join_session', { sessionId: Number(sessionId) });
    });

    socket.on('new_qr', (qrData) => {
      console.log('[Socket] Nhận mã QR động mới:', qrData);
      const tokenStr = typeof qrData === 'string' ? qrData : qrData?.token || qrData?.qr_token || '';
      setQrToken(tokenStr);
      setCountdown(10);
    });

    socket.on('attendance_scanned', (data) => {
      console.log('[Socket] Sinh viên điểm danh thành công:', data);
      setScannedStudents((prev) => {
        const id = data.student_id || data.studentId || data.id;
        const exists = prev.some((s) => (s.studentId || s.student_id) === id);
        return exists ? prev : [data, ...prev];
      });
    });

    socket.on('session_expired', (data) => {
      console.log('[Socket] Phiên điểm danh đã kết thúc:', data);
      setIsSessionActive(false);
      setQrToken('');
      setCurrentSession(null);
      setConflictSessionId(null);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    });

    socket.on('error', (err) => {
      console.error('[Socket] Lỗi từ máy chủ:', err);
    });

    return socket;
  }, []);

  // Kiểm tra và tự động khôi phục phiên đang hoạt động của lớp học phần
  const checkActiveSession = useCallback(
    async (courseId) => {
      if (!courseId) return null;
      try {
        const res = await axiosClient.get(`/courses/${courseId}/sessions`);
        const sessionList = res.data?.sessions || res.data?.data?.sessions || (Array.isArray(res.data) ? res.data : []);
        setCourseSessions(sessionList);

        const active = sessionList.find(
          (s) => s.status === 'ACTIVE' && !s.closed_at && new Date(s.end_time).getTime() > Date.now()
        );

        if (active) {
          const remaining = Math.max(0, Math.floor((new Date(active.end_time).getTime() - Date.now()) / 1000));
          if (remaining > 0) {
            setCurrentSession(active);
            setIsSessionActive(true);
            setSessionTimeLeft(remaining);
            setCountdown(10);
            setSelectedSessionNumber(active.session_number || 1);
            setConflictSessionId(null);
            setErrorMessage('');
            setInfoMessage(`Đang khôi phục và tiếp tục chiếu Buổi ${active.session_number || 1} (Mã phiên #${active.id})`);
            connectSessionSocket(active.id);
            fetchSessionRecords(active.id);
            return active;
          }
        } else {
          // Nếu không còn phiên nào active, tự động gợi ý buổi tiếp theo chưa học
          setIsSessionActive(false);
          setCurrentSession(null);
          setQrToken('');
          setConflictSessionId(null);

          const usedNums = new Set(sessionList.map((s) => s.session_number).filter(Boolean));
          let nextBuoi = 1;
          for (let i = 1; i <= 100; i++) {
            if (!usedNums.has(i)) {
              nextBuoi = i;
              break;
            }
          }
          setSelectedSessionNumber(nextBuoi);
        }
      } catch (err) {
        console.warn('Lỗi khi kiểm tra phiên điểm danh hoạt động:', err);
      }
      return null;
    },
    [connectSessionSocket, fetchSessionRecords]
  );

  // Tự động kiểm tra phiên hoạt động mỗi khi chọn hoặc đổi lớp học phần
  useEffect(() => {
    if (!selectedClass) return;
    checkActiveSession(selectedClass);
  }, [selectedClass, checkActiveSession]);

  // Đếm ngược thời gian đổi mã (10s) và thời gian phiên chiếu
  useEffect(() => {
    if (!isSessionActive) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 10));
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          handleStopSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionActive]);

  // Tự động làm mới danh sách sinh viên quét mã mỗi 5 giây khi phiên đang hoạt động
  useEffect(() => {
    if (!isSessionActive || !currentSession?.id) return;

    const interval = setInterval(() => {
      fetchSessionRecords(currentSession.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [isSessionActive, currentSession?.id, fetchSessionRecords]);

  // Dọn dẹp kết nối Socket khi unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Dừng / Kết thúc phiên điểm danh
  const handleStopSession = useCallback(
    async (targetId) => {
      const sessionIdToClose = targetId || currentSession?.id || conflictSessionId;

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (sessionIdToClose && selectedClass) {
        try {
          await axiosClient.post(`/courses/${selectedClass}/sessions/${sessionIdToClose}/close`);
          // Cập nhật lại danh sách các buổi học sau khi đóng phiên
          const res = await axiosClient.get(`/courses/${selectedClass}/sessions`);
          const sessionList = res.data?.sessions || res.data?.data?.sessions || [];
          setCourseSessions(sessionList);
        } catch (err) {
          console.warn('Đóng phiên ở backend gặp lỗi hoặc phiên đã kết thúc trước đó:', err);
        }
      }

      setIsSessionActive(false);
      setQrToken('');
      setCurrentSession(null);
      setConflictSessionId(null);
      setErrorMessage('');
      setInfoMessage('');
      setSessionTimeLeft(0);
    },
    [currentSession, conflictSessionId, selectedClass]
  );

  // Đóng phiên cũ đang xung đột và mở phiên mới ngay
  const handleForceCloseAndRestart = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');
    try {
      const res = await axiosClient.get(`/courses/${selectedClass}/sessions`);
      const sessionList = res.data?.sessions || res.data?.data?.sessions || [];
      const active = sessionList.find((s) => s.status === 'ACTIVE' && !s.closed_at);
      if (active) {
        await axiosClient.post(`/courses/${selectedClass}/sessions/${active.id}/close`);
      } else if (conflictSessionId) {
        await axiosClient.post(`/courses/${selectedClass}/sessions/${conflictSessionId}/close`);
      }
      setConflictSessionId(null);
      setInfoMessage('Đã đóng phiên cũ thành công. Đang khởi tạo phiên mới...');
      setTimeout(() => {
        handleStartSession();
      }, 500);
    } catch (err) {
      console.error('Lỗi khi đóng phiên cũ:', err);
      setErrorMessage('Không thể đóng phiên cũ: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  // Mở phiên điểm danh qua API Backend thật & Kết nối Socket.io
  const handleStartSession = async () => {
    if (!selectedClass) {
      setErrorMessage('Vui lòng chọn một lớp học phần!');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');
    setConflictSessionId(null);
    setScannedStudents([]);

    try {
      // 1. Xác định tọa độ GPS hiện tại của giảng viên
      let currentLat = coords?.latitude;
      let currentLng = coords?.longitude;

      if (currentLat === undefined || currentLng === undefined || currentLat === null || currentLng === null) {
        setErrorMessage('Đang tự động xác định vị trí GPS từ trình duyệt...');
        try {
          const pos = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error('Trình duyệt không hỗ trợ Geolocation'));
              return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          currentLat = Number(pos.coords.latitude.toFixed(6));
          currentLng = Number(pos.coords.longitude.toFixed(6));
          setCoords({
            latitude: currentLat,
            longitude: currentLng,
            accuracy: Math.round(pos.coords.accuracy || 0),
          });
          setLocationError('');
        } catch (geoErr) {
          const errMsg =
            geoErr.code === 1
              ? 'Trình duyệt bị từ chối quyền truy cập Vị trí. Vui lòng cho phép quyền Vị trí (Location) trong cài đặt trình duyệt để mở phiên điểm danh!'
              : 'Không thể xác định vị trí GPS hiện tại. Vui lòng bật định vị trên máy và bấm "Cập nhật lại GPS".';
          setErrorMessage(errMsg);
          setLocationError(errMsg);
          setLoading(false);
          return;
        }
      }

      const payload = {
        durationMinutes: selectedDuration,
        duration_minutes: selectedDuration,
        latitude: currentLat,
        longitude: currentLng,
        radius_meters: Number(radiusMeters) || 50,
        session_number: selectedSessionNumber,
        sessionNumber: selectedSessionNumber,
      };

      // 2. Gọi API POST /courses/${courseId}/sessions kèm session_number và durationMinutes
      const response = await axiosClient.post(`/courses/${selectedClass}/sessions`, payload);

      const session = response.data?.session || response?.session || response.data || response;
      const sessionId = session?.id;

      if (!sessionId) {
        throw new Error('Không nhận được thông tin phiên điểm danh từ hệ thống.');
      }

      setCurrentSession(session);
      setIsSessionActive(true);
      setSessionTimeLeft(selectedDuration * 60);
      setCountdown(10);
      setInfoMessage(`Đã mở phiên điểm danh Buổi ${selectedSessionNumber} (Mã phiên #${sessionId})`);

      // 3. Kết nối Socket.io
      connectSessionSocket(sessionId);
    } catch (err) {
      console.error('Lỗi khi mở phiên điểm danh:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Không thể mở phiên điểm danh. Vui lòng kiểm tra lại!';

      // Nếu lỗi do đã có phiên active đang chạy (409 Conflict)
      if (err.response?.status === 409 || /already exists/i.test(errMsg)) {
        const resumed = await checkActiveSession(selectedClass);
        if (resumed) {
          setInfoMessage(`Đã tự động kết nối và tiếp tục Buổi ${resumed.session_number || selectedSessionNumber} (Mã #${resumed.id}) đang hoạt động.`);
          setErrorMessage('');
        } else {
          setErrorMessage('Lớp học phần này đang có một phiên điểm danh chưa kết thúc.');
          setConflictSessionId(true);
        }
      } else {
        setErrorMessage(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Format phút:giây
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedCourseObj = courses.find((c) => c.id.toString() === selectedClass);
  const totalSessions = Number(selectedCourseObj?.total_sessions || selectedCourseObj?.totalSessions || 10);

  // Kiểm tra buổi học đang chọn đã từng hoàn thành hay chưa
  const existingCompletedSession = courseSessions.find(
    (s) => Number(s.session_number) === Number(selectedSessionNumber) && s.status !== 'ACTIVE'
  );
  const isCompletedBuoi = Boolean(existingCompletedSession);
  const completedDate = existingCompletedSession?.start_time
    ? new Date(existingCompletedSession.start_time).toLocaleDateString('vi-VN')
    : '';

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#081c36', margin: '0 0 4px 0' }}>
          Máy chiếu QR Điểm danh Trực tiếp
        </h1>
        <p style={{ fontSize: '13px', color: '#7589a3', margin: 0 }}>
          Tạo mã QR động để sinh viên quét điểm danh trực tiếp tại lớp.
        </p>
      </div>

      {/* Thông báo thành công / khôi phục phiên */}
      {infoMessage && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', color: '#16a34a', fontSize: '13px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span>{infoMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setInfoMessage('')}
            style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Thông báo lỗi nếu mở phiên thất bại / xung đột */}
      {errorMessage && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 16px', color: '#ef4444', fontSize: '13px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {conflictSessionId && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => checkActiveSession(selectedClass)}
                style={{ backgroundColor: '#0068ff', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                Khôi phục phiên đang mở
              </button>
              <button
                type="button"
                onClick={handleForceCloseAndRestart}
                style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                Đóng phiên cũ & Mở mới
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Khung Cấu Hình Phiên Chiếu */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#e5efff', color: '#0068ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#081c36', margin: 0 }}>Cấu hình phiên chiếu</h2>
              <p style={{ fontSize: '12px', color: '#7589a3', margin: 0 }}>Chọn lớp học phần và thời lượng trước khi bật</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#081c36', marginBottom: '6px' }}>
                Chọn lớp học phần *
              </label>
              <select
                disabled={isSessionActive}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e1e4e8', backgroundColor: '#f5f7fb', fontSize: '14px', outline: 'none' }}
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

            {/* Chọn Buổi học cần điểm danh */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#081c36', margin: 0 }}>
                  Chọn buổi học cần điểm danh *
                </label>
                <span style={{ fontSize: '11px', color: '#0068ff', fontWeight: '600', backgroundColor: '#e5efff', padding: '2px 8px', borderRadius: '12px' }}>
                  Tổng: {totalSessions} buổi
                </span>
              </div>
              <select
                disabled={isSessionActive}
                value={selectedSessionNumber}
                onChange={(e) => setSelectedSessionNumber(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e1e4e8', backgroundColor: '#f5f7fb', fontSize: '14px', outline: 'none' }}
              >
                {Array.from({ length: totalSessions }, (_, i) => i + 1).map((buoi) => {
                  const pastSession = courseSessions.find((s) => Number(s.session_number) === buoi);
                  let statusLabel = 'Chưa học';
                  if (pastSession) {
                    const dateStr = pastSession.start_time
                      ? new Date(pastSession.start_time).toLocaleDateString('vi-VN')
                      : '';
                    statusLabel =
                      pastSession.status === 'ACTIVE'
                        ? '🔥 Đang mở (Hôm nay)'
                        : `✓ Đã học (${dateStr})`;
                  }
                  return (
                    <option key={buoi} value={buoi}>
                      Buổi {buoi}: {statusLabel}
                    </option>
                  );
                })}
              </select>

              {/* Cảnh báo nếu chọn lại buổi đã từng học */}
              {isCompletedBuoi && !isSessionActive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', color: '#b45309', fontSize: '12px', marginTop: '8px' }}>
                  <AlertCircle size={16} className="shrink-0" />
                  <span>Buổi {selectedSessionNumber} đã được điểm danh vào ngày {completedDate}. Mở lại phiên sẽ dùng cho sinh viên quét bổ sung.</span>
                </div>
              )}
            </div>

            {/* Cấu hình Vị trí GPS Tự động & Bán kính */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e1e4e8', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#081c36', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="#0068ff" /> Vị trí phòng học (GPS tự động)
                </span>
                <button
                  type="button"
                  onClick={fetchBrowserLocation}
                  disabled={locating || isSessionActive}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: '#0068ff',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: locating || isSessionActive ? 'not-allowed' : 'pointer',
                    padding: 0,
                  }}
                >
                  <RefreshCw size={12} className={locating ? 'animate-spin' : ''} />
                  {locating ? 'Đang định vị...' : 'Cập nhật lại GPS'}
                </button>
              </div>

              {/* Trạng thái định vị */}
              {locating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#1d4ed8', fontSize: '12px' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang tự động lấy tọa độ GPS từ trình duyệt...</span>
                </div>
              ) : locationError ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#ef4444', fontSize: '12px' }}>
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{locationError}</span>
                </div>
              ) : coords ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#16a34a', fontSize: '12px' }}>
                  <div>
                    <span style={{ fontWeight: '600', display: 'block' }}>
                      Vĩ độ: {coords.latitude} • Kinh độ: {coords.longitude}
                    </span>
                    <span style={{ fontSize: '11px', color: '#15803d' }}>
                      ✓ Độ chính xác thiết bị: ±{coords.accuracy}m
                    </span>
                  </div>
                  <CheckCircle size={16} />
                </div>
              ) : (
                <div style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px', color: '#64748b', fontSize: '12px' }}>
                  Chưa xác định được vị trí. Nhấn "Cập nhật lại GPS" để cấp quyền.
                </div>
              )}

              {/* Chọn Bán kính cho phép */}
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Bán kính điểm danh cho phép (Radius)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[
                    { label: '50m', val: '50' },
                    { label: '100m', val: '100' },
                    { label: '150m', val: '150' },
                    { label: '200m', val: '200' },
                  ].map((r) => (
                    <button
                      key={r.val}
                      type="button"
                      disabled={isSessionActive}
                      onClick={() => setRadiusMeters(r.val)}
                      style={{
                        padding: '6px 0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: radiusMeters === r.val ? '2px solid #0068ff' : '1px solid #cbd5e1',
                        backgroundColor: radiusMeters === r.val ? '#eff6ff' : '#ffffff',
                        color: radiusMeters === r.val ? '#0068ff' : '#334155',
                        cursor: isSessionActive ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#081c36', marginBottom: '8px' }}>
                Thời lượng điểm danh
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    disabled={isSessionActive}
                    onClick={() => setSelectedDuration(mins)}
                    style={{
                      padding: '8px 0',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      border: selectedDuration === mins ? '2px solid #0068ff' : '1px solid #e1e4e8',
                      backgroundColor: selectedDuration === mins ? '#e5efff' : '#ffffff',
                      color: selectedDuration === mins ? '#0068ff' : '#081c36',
                      cursor: isSessionActive ? 'not-allowed' : 'pointer',
                      opacity: isSessionActive && selectedDuration !== mins ? 0.5 : 1,
                    }}
                  >
                    {mins} phút
                  </button>
                ))}
              </div>
            </div>

            {!isSessionActive ? (
              <button
                onClick={handleStartSession}
                disabled={loading}
                style={{
                  marginTop: '8px',
                  backgroundColor: '#0068ff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(0, 104, 255, 0.2)',
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                {loading ? 'Đang khởi tạo phiên...' : 'Mở phiên điểm danh ngay'}
              </button>
            ) : (
              <button
                onClick={handleStopSession}
                style={{
                  marginTop: '8px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                }}
              >
                <Square size={18} />
                Kết thúc phiên điểm danh
              </button>
            )}
          </div>
        </div>

        {/* Khung Chiếu Mã QR Trực Tiếp */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {isSessionActive ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
                <ShieldCheck size={14} />
                Đang điểm danh: Buổi {currentSession?.session_number || selectedSessionNumber} / {totalSessions} • Mã phiên #{currentSession?.id}
              </div>

              <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '3px solid #0068ff', borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,104,255,0.15)', marginBottom: '16px' }}>
                {qrToken ? (
                  <QRCodeSVG value={qrToken} size={220} level="H" includeMargin={true} />
                ) : (
                  <div style={{ width: '220px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#0068ff' }}>
                    <Loader2 size={32} className="animate-spin" />
                    <span style={{ fontSize: '12px', color: '#7589a3' }}>Đang tải mã QR...</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#081c36', fontWeight: '600' }}>
                  <RefreshCw size={16} style={{ color: '#0068ff' }} />
                  Đổi mã trong: <span style={{ color: '#0068ff', fontSize: '16px' }}>{countdown}s</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#7589a3' }}>
                  <Clock size={16} />
                  Thời gian phiên: <span style={{ color: '#081c36', fontWeight: '600' }}>{formatTime(sessionTimeLeft)}</span>
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                Mã QR tự động làm mới định kỳ để bảo đảm tính chính xác khi điểm danh.
              </p>
            </div>
          ) : (
            <>
              <div style={{ width: '120px', height: '120px', backgroundColor: '#f5f7fb', border: '2px dashed #e1e4e8', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7589a3', marginBottom: '16px' }}>
                <QrCode size={48} />
              </div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#081c36', margin: '0 0 4px 0' }}>Sẵn sàng chiếu màn hình</p>
              <p style={{ fontSize: '12px', color: '#7589a3', margin: 0, maxWidth: '280px' }}>
                Mã QR điểm danh sẽ hiển thị ngay khi bạn nhấn "Mở phiên điểm danh ngay".
              </p>
            </>
          )}
        </div>
      </div>

      {/* Bảng Danh Sách Sinh Viên Vừa Quét Realtime */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e1e4e8', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e5efff', color: '#0068ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#081c36', margin: 0 }}>
                Sinh viên vừa quét thành công
              </h3>
              <p style={{ fontSize: '12px', color: '#7589a3', margin: 0 }}>Danh sách sinh viên có mặt được cập nhật theo thời gian thực</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => currentSession?.id && fetchSessionRecords(currentSession.id)}
              disabled={!isSessionActive}
              title="Làm mới danh sách sinh viên"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '12px',
                color: '#475569',
                cursor: isSessionActive ? 'pointer' : 'not-allowed',
              }}
            >
              <RefreshCw size={12} />
              Làm mới
            </button>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#0068ff', backgroundColor: '#e5efff', padding: '4px 12px', borderRadius: '20px' }}>
              Đã quét: {scannedStudents.length} sinh viên
            </span>
          </div>
        </div>

        {scannedStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#7589a3', fontSize: '13px' }}>
            {isSessionActive
              ? 'Đang chờ sinh viên quét mã... Danh sách sinh viên sẽ hiển thị theo thời gian thực tại đây.'
              : 'Chưa có lượt quét nào. Hãy mở phiên để bắt đầu nhận dữ liệu điểm danh trực tiếp.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f7fb', borderBottom: '1px solid #e1e4e8', color: '#081c36', fontWeight: '600' }}>
                  <th style={{ padding: '12px 16px' }}>STT</th>
                  <th style={{ padding: '12px 16px' }}>MSSV / Username</th>
                  <th style={{ padding: '12px 16px' }}>Thời gian quét</th>
                  <th style={{ padding: '12px 16px' }}>Khoảng cách</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {scannedStudents.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '12px 16px', color: '#7589a3' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0068ff' }}>{item.username || item.studentId}</td>
                    <td style={{ padding: '12px 16px', color: '#081c36' }}>
                      {item.scannedAt ? new Date(item.scannedAt).toLocaleTimeString('vi-VN') : 'Vừa xong'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#7589a3' }}>
                      {item.distanceMeters !== undefined ? `${item.distanceMeters}m` : 'Hợp lệ'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                        <CheckCircle size={12} />
                        {item.status === 'PRESENT' ? 'Có mặt' : (item.status || 'Thành công')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default QRProjector;
