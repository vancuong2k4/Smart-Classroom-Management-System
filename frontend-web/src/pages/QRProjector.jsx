import { useState, useEffect, useCallback } from 'react';
import { QrCode, Play, Square, RefreshCw, Clock, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

function QRProjector() {
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(15 * 60);

  // Sinh mã QR ngẫu nhiên mới mỗi 10 giây
  const generateNewToken = useCallback(() => {
    const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = Date.now();
    setQrToken(`SCMS-SESSION-${selectedClass}-${randomCode}-${timestamp}`);
    setCountdown(10);
  }, [selectedClass]);

  // Bắt đầu / Bật phiên điểm danh
  const handleStartSession = () => {
    setIsSessionActive(true);
    setSessionTimeLeft(selectedDuration * 60);
    generateNewToken();
  };

  // Dừng phiên điểm danh
  const handleStopSession = () => {
    setIsSessionActive(false);
    setQrToken('');
  };

  // Xử lý đếm ngược tự động đổi mã QR mỗi 10 giây
  useEffect(() => {
    let timer = null;
    if (isSessionActive) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            generateNewToken();
            return 10;
          }
          return prev - 1;
        });

        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            setIsSessionActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionActive, generateNewToken]);

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
          Máy chiếu QR Điểm danh
        </h1>
        <p style={{ fontSize: '13px', color: '#7589a3', margin: 0 }}>
          Tạo phiên điểm danh với mã QR bảo mật tự đổi mỗi 10 giây, chống gian lận vị trí & chụp màn hình.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Khung Cấu Hình Phiên Chiếu */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#e5efff', color: '#0068ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#081c36', margin: 0 }}>Cấu hình phiên chiếu</h2>
              <p style={{ fontSize: '12px', color: '#7589a3', margin: 0 }}>Chọn lớp học và thời lượng trước khi bật</p>
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
                <option value="1">Lập trình Web nâng cao - Nhóm 01</option>
                <option value="2">Lập trình Windows - Nhóm 02</option>
              </select>
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
                      opacity: isSessionActive && selectedDuration !== mins ? 0.5 : 1
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
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 104, 255, 0.2)'
                }}
              >
                <Play size={18} />
                Mở phiên điểm danh ngay
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
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
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
                Phiên chiếu đang hoạt động
              </div>

              <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '3px solid #0068ff', borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,104,255,0.15)', marginBottom: '16px' }}>
                <QRCodeSVG value={qrToken} size={220} level="H" includeMargin={true} />
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
                Sinh viên dùng ứng dụng quét mã trực tiếp trên máy chiếu để điểm danh.
              </p>
            </div>
          ) : (
            <>
              <div style={{ width: '120px', height: '120px', backgroundColor: '#f5f7fb', border: '2px dashed #e1e4e8', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7589a3', marginBottom: '16px' }}>
                <QrCode size={48} />
              </div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#081c36', margin: '0 0 4px 0' }}>Sẵn sàng chiếu màn hình</p>
              <p style={{ fontSize: '12px', color: '#7589a3', margin: 0, maxWidth: '280px' }}>
                Mã QR sẽ tự động tạo và phóng to chuẩn máy chiếu ngay khi bạn nhấn nút "Mở phiên điểm danh ngay".
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRProjector;