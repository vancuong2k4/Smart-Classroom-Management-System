import axios from 'axios';

// Cấu hình Base URL API: Mặc định dùng '/api' để chuyển tiếp tới Mock Server / Backend
// hoặc nhận giá trị từ biến môi trường VITE_API_BASE_URL (ví dụ: 'http://localhost:3000/api')
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Tự động đính kèm Authorization: Bearer <token> từ localStorage
axiosClient.interceptors.request.use(
  (config) => {
    // Chuẩn hóa path: Đảm bảo request luôn có tiền tố /api
    if (config.baseURL?.endsWith('/api') && config.url?.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    } else if (!config.baseURL?.endsWith('/api') && !config.url?.startsWith('/api')) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Trả về trực tiếp data và bắt lỗi xác thực (401)
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Tự động xử lý khi Token hết hạn hoặc không có quyền (401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
