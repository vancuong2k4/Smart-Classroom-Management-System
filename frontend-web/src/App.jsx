import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import các Components và Pages
import Layout from './components/Layout';
import Login from './pages/Login';
import Courses from './pages/Courses';
import QRProjector from './pages/QRProjector';
import Statistics from './pages/Statistics';

// Component Bảo vệ Tuyến đường (Chặn người dùng chưa đăng nhập)
function ProtectedRoute({ token, children }) {
  const location = useLocation();

  if (!token) {
    // Chuyển hướng về trang login và lưu trạng thái trang đích
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

// Component Chặn truy cập trang Login nếu đã đăng nhập có Token
function PublicOnlyRoute({ token, children }) {
  if (token) {
    return <Navigate to="/courses" replace />;
  }

  return children;
}

function App() {
  // Quản lý trạng thái JWT Token từ LocalStorage
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // Hàm đồng bộ trạng thái khi đăng nhập thành công
  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  // Lắng nghe thay đổi storage giữa các Tab trình duyệt
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        setToken(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Tuyến đường Đăng nhập (Chỉ cho phép khi chưa đăng nhập) */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute token={token}>
              <Login onLoginSuccess={handleLoginSuccess} />
            </PublicOnlyRoute>
          }
        />

        {/* Các Tuyến đường Bảo vệ (Bắt buộc phải có Token) */}
        <Route
          path="/"
          element={
            <ProtectedRoute token={token}>
              <Layout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          {/* Đường dẫn mặc định khi đăng nhập xong chuyển về /courses */}
          <Route index element={<Navigate to="/courses" replace />} />
          <Route path="courses" element={<Courses />} />
          <Route path="qr-projector" element={<QRProjector />} />
          <Route path="projector" element={<QRProjector />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="reports" element={<Statistics />} />
        </Route>

        {/* Bắt mọi đường dẫn không hợp lệ chuyển về trang chính */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;