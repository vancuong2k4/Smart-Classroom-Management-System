import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, QrCode, BarChart3, LogOut, GraduationCap, ShieldCheck } from 'lucide-react';

function Layout({ onLogout }) {
  const navigate = useNavigate();

  // Đọc thông tin Giảng viên đăng nhập từ LocalStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { fullName: 'Giảng viên', code: 'GV-2026', role: 'Giảng viên' };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
      if (onLogout) {
        onLogout();
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      navigate('/login', { replace: true });
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#f5f7fb' }}>
      {/* 1. SIDEBAR DẠNG CỐ ĐỊNH ZALO BLUE */}
      <aside 
        style={{ 
          width: '260px', 
          backgroundColor: '#0068ff', 
          color: '#ffffff', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          padding: '20px 16px',
          boxShadow: '4px 0 16px rgba(0, 104, 255, 0.15)',
          zIndex: 10,
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0
        }}
      >
        <div>
          {/* Logo & Tên Dự Án */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#ffffff', color: '#0068ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0, lineHeight: 1.2 }}>SmartClass</h1>
              <p style={{ fontSize: '11px', color: '#e0edff', margin: 0 }}>Quản Lý Lớp Học</p>
            </div>
          </div>

          {/* Badge Học Kỳ Active */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: '#ffffff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            Học kỳ 1 • 2026 - 2027
          </div>

          {/* Danh Sách Menu Điều Hướng (Navigation) */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#a3c7ff', letterSpacing: '0.5px', padding: '0 12px 6px 12px' }}>
              Chức năng chính
            </span>

            <NavLink
              to="/courses"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                textDecoration: 'none',
                backgroundColor: isActive ? '#0040a8' : 'transparent',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s ease'
              })}
            >
              <BookOpen size={20} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>Quản lý khóa học</span>
                <span style={{ fontSize: '10px', color: '#e0edff', fontWeight: 'normal' }}>Danh sách lớp và môn học</span>
              </div>
            </NavLink>

            <NavLink
              to="/qr-projector"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                textDecoration: 'none',
                backgroundColor: isActive ? '#0040a8' : 'transparent',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s ease'
              })}
            >
              <QrCode size={20} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>Máy chiếu QR</span>
                <span style={{ fontSize: '10px', color: '#e0edff', fontWeight: 'normal' }}>Điểm danh thời gian thực</span>
              </div>
            </NavLink>

            <NavLink
              to="/statistics"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                textDecoration: 'none',
                backgroundColor: isActive ? '#0040a8' : 'transparent',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s ease'
              })}
            >
              <BarChart3 size={20} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>Thống kê</span>
                <span style={{ fontSize: '10px', color: '#e0edff', fontWeight: 'normal' }}>Báo cáo chuyên cần & tỷ lệ</span>
              </div>
            </NavLink>
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px', fontSize: '11px', color: '#e0edff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            <span>Hệ thống: Trực tuyến</span>
          </div>
          <span style={{ opacity: 0.8 }}>SCMS Web v2.4.0</span>
        </div>
      </aside>

      {/* 2. KHU VỰC NỘI DUNG CHÍNH (CONTENT AREA) */}
      <div style={{ marginLeft: '260px', width: 'calc(100% - 260px)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header trên cùng */}
        <header 
          style={{ 
            height: '64px', 
            backgroundColor: '#ffffff', 
            borderBottom: '1px solid #e1e4e8', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 5,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#081c36', margin: 0 }}>Hệ Thống Quản Lý Thông Minh</h2>
            <p style={{ fontSize: '11px', color: '#7589a3', margin: 0 }}>Nền tảng điểm danh & theo dõi tiến độ giảng dạy</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Khung Thông Tin Giảng Viên */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f5f7fb', padding: '6px 12px', borderRadius: '20px', border: '1px solid #e1e4e8' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e5efff', color: '#0068ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' }}>
                GV
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#081c36', lineHeight: 1.2 }}>{user.fullName || 'Giảng viên'}</span>
                <span style={{ fontSize: '10px', color: '#0068ff', fontWeight: '500' }}>Mã: {user.code || 'GV-2026'}</span>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#e5efff', color: '#0068ff', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', marginLeft: '4px' }}>
                <ShieldCheck size={12} /> {user.role || 'Giảng viên'}
              </span>
            </div>

            {/* Nút Đăng Xuất */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Nội dung các trang con (Outlet) */}
        <main style={{ flex: 1, backgroundColor: '#f5f7fb' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;