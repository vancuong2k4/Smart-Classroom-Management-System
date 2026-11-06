import { useState, useEffect, useRef } from 'react';
import { QrCode, Play, Square, RefreshCw, Clock, ShieldCheck, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import axiosClient from '../api/axiosClient';

function QRProjector() {
  const [courses, setCourses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [qrToken, setQrToken] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(15 * 60);
  const [scannedStudents, setScannedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [classLatitude, setClassLatitude] = useState('');
  const [classLongitude, setClassLongitude] = useState('');
  const [allowedNetwork, setAllowedNetwork] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('50');

  const socketRef = useRef(null);

  // 1. Tải danh sách lớp học thật của giảng viên từ Database khi mở trang
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axiosClient.get('/courses');
        const courseList = response.data?.courses || response?.courses || (Array.isArray(response) ? response : []);
        setCourses(courseList);
        if (courseList.length > 0) {
          setSelectedClass(courseList[0].id.toString());
        }
      } catch (err) {
        console.error('Không thể tải danh sách khóa học:', err);
      }
    };
    fetchCourses();
  }, []);

  // Đếm ngược thời gian đổi mã (10s) và thời gian phiên chiếu
  useEffect(() => {
    let timer = null;
    if (isSessionActive) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 1 ? prev - 1 : 10));

        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            handleStopSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionActive]);

  // Dọn dẹp kết nối Socket khi unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // 2. Mở phiên điểm danh qua API Backend thật & Kết nối Socket.io
  const handleStartSession = async () => {
    if (!selectedClass) {
      setErrorMessage('Vui lòng chọn một lớp học phần!');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setScannedStudents([]);

    try {
      const latitude = Number(classLatitude);
      const longitude = Number(classLongitude);
      const radius = Number(radiusMeters);
      if (!classLatitude.trim() || !classLongitude.trim() ||
          !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
          !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new Error('Vui lòng nhập tọa độ lớp hợp lệ.');
      }
      if (!Number.isFinite(radius) || radius < 10 || radius > 1000) {
        throw new Error('Bán kính phải từ 10 đến 1000 mét.');
      }
      if (!allowedNetwork.trim()) {
        throw new Error('Vui lòng nhập mạng IP được phép của lớp.');
      }
      if (/\/0$/.test(allowedNetwork.trim())) {
        throw new Error('Vui lòng nhập mạng cụ thể, không dùng dải cho phép mọi IP.');
      }
      // 2. Gọi API POST /api/courses/${courseId}/sessions kèm durationMinutes
      const response = await axiosClient.post(`/courses/${selectedClass}/sessions`, {
        durationMinutes: selectedDuration,
        duration_minutes: selectedDuration,
        latitude,
        longitude,
        ip_range: allowedNetwork.trim(),
        radius_meters: radius,
      });

      const session = response.data?.session || response?.session || response.data || response;
      const sessionId = session?.id;

      if (!sessionId) {
        throw new Error('Không nhận được mã phiên (sessionId) từ máy chủ.');
      }

      setCurrentSession(session);
      setIsSessionActive(true);
      setSessionTimeLeft(selectedDuration * 60);
      setCountdown(10);

      // 3. Dùng socket.io-client kết nối tới http://localhost:3000 (gửi auth token từ localStorage)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const socket = io('http://localhost:3000', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      // 4. Emit sự kiện 'join_session' kèm { sessionId } khi kết nối
      socket.on('connect', () => {
        console.log('[Socket] Đã kết nối tới server:', socket.id);
        socket.emit('join_session', { sessionId: Number(sessionId) });
      });

      // 5. Lắng nghe sự kiện 'new_qr' từ server bắn về để nhận chuỗi token QR thật
      socket.on('new_qr', (qrData) => {
        console.log('[Socket] Nhận mã QR động mới:', qrData);
        const tokenStr = typeof qrData === 'string' ? qrData : qrData?.token || '';
        setQrToken(tokenStr);
        setCountdown(10);
      });

      // 6. Lắng nghe sự kiện 'attendance_scanned' để cập nhật realtime danh sách SV vừa quét thành công
      socket.on('attendance_scanned', (data) => {
        console.log('[Socket] Sinh viên điểm danh thành công:', data);
        setScannedStudents((prev) => [data, ...prev]);
      });

      // Lắng nghe khi phiên kết thúc từ server
      socket.on('session_expired', (data) => {
        console.log('[Socket] Phiên điểm danh đã kết thúc:', data);
        setIsSessionActive(false);
        setQrToken('');
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      });

      socket.on('error', (err) => {
        console.error('[Socket] Lỗi từ máy chủ:', err);
      });
    } catch (err) {
      console.error('Lỗi khi mở phiên điểm danh:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Không thể mở phiên điểm danh. Vui lòng kiểm tra lại!';
      setErrorMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Dừng / Kết thúc phiên điểm danh
  const handleStopSession = async () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (currentSession?.id && selectedClass) {
      try {
        await axiosClient.post(`/courses/${selectedClass}/sessions/${currentSession.id}/close`);
      } catch (err) {
        console.warn('Đóng phiên ở backend gặp lỗi hoặc phiên đã kết thúc trước đó:', err);
      }
    }

    setIsSessionActive(false);
    setQrToken('');
    setCurrentSession(null);
  };

  // Format phút:giây
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#081c36', margin: '0 0 4px 0' }}>
          Máy chiếu QR Điểm danh Trực tiếp
        </h1>
        <p style={{ fontSize: '13px', color: '#7589a3', margin: 0 }}>
          Kết nối Backend Socket.io Realtime, tự động đổi mã QR mỗi 10 giây và cập nhật tức thì danh sách sinh viên quét mã.
        </p>
      </div>

      {/* Thông báo lỗi nếu mở phiên thất bại */}
      {errorMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 16px', color: '#ef4444', fontSize: '13px', marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
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

            <fieldset disabled={isSessionActive || loading}
              style={{ border: '1px solid #e1e4e8', borderRadius: '12px', padding: '14px', margin: 0 }}>
              <legend style={{ color: '#081c36', fontWeight: 600, fontSize: '13px' }}>
                Vị trí và phạm vi lớp học
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {[
                  ['Vĩ độ', classLatitude, setClassLatitude, 'Ví dụ: 10.123456'],
                  ['Kinh độ', classLongitude, setClassLongitude, 'Ví dụ: 106.123456'],
                  ['Mạng IP được phép (CIDR)', allowedNetwork, setAllowedNetwork, 'Ví dụ: 192.168.1.0/24'],
                  ['Bán kính (mét)', radiusMeters, setRadiusMeters, '50'],
                ].map(([label, value, setter, placeholder]) => (
                  <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#081c36' }}>
                    {label}
                    <input value={value} onChange={(event) => setter(event.target.value)}
                      placeholder={placeholder}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #e1e4e8', background: '#f5f7fb' }} />
                  </label>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#7589a3', marginBottom: 0 }}>
                Nhập tọa độ tại lớp và dải mạng do quản trị viên cung cấp.
              </p>
            </fieldset>

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
                Phiên chiếu Socket.io đang hoạt động (ID: {currentSession?.id})
              </div>

              <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '3px solid #0068ff', borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,104,255,0.15)', marginBottom: '16px' }}>
                {qrToken ? (
                  <QRCodeSVG value={qrToken} size={220} level="H" includeMargin={true} />
                ) : (
                  <div style={{ width: '220px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#0068ff' }}>
                    <Loader2 size={32} className="animate-spin" />
                    <span style={{ fontSize: '12px', color: '#7589a3' }}>Đang nhận mã QR từ Socket...</span>
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
                Mã QR được cấp phát tự động từ Redis và Socket.io của Backend.
              </p>
            </div>
          ) : (
            <>
              <div style={{ width: '120px', height: '120px', backgroundColor: '#f5f7fb', border: '2px dashed #e1e4e8', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7589a3', marginBottom: '16px' }}>
                <QrCode size={48} />
              </div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#081c36', margin: '0 0 4px 0' }}>Sẵn sàng chiếu màn hình</p>
              <p style={{ fontSize: '12px', color: '#7589a3', margin: 0, maxWidth: '280px' }}>
                Mã QR bảo mật thật từ máy chủ sẽ hiển thị ngay khi bạn nhấn "Mở phiên điểm danh ngay".
              </p>
            </>
          )}
        </div>
      </div>

      {/* Bảng Danh Sách Sinh Viên Vừa Quét Realtime (attendance_scanned) */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e1e4e8', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e5efff', color: '#0068ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#081c36', margin: 0 }}>
                Sinh viên vừa quét thành công (Realtime)
              </h3>
              <p style={{ fontSize: '12px', color: '#7589a3', margin: 0 }}>Cập nhật tức thời qua sự kiện Socket.io `attendance_scanned`</p>
            </div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#0068ff', backgroundColor: '#e5efff', padding: '4px 12px', borderRadius: '20px' }}>
            Đã quét: {scannedStudents.length} sinh viên
          </span>
        </div>

        {scannedStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#7589a3', fontSize: '13px' }}>
            {isSessionActive
              ? 'Đang chờ sinh viên quét mã... Danh sách sinh viên sẽ nhảy theo thời gian thực tại đây.'
              : 'Chưa có lượt quét nào. Hãy mở phiên để bắt đầu nhận dữ liệu điểm danh realtime.'}
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