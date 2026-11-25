import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  KeyRound, 
  Smartphone, 
  Lock, 
  Unlock, 
  Search, 
  RefreshCw, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  X, 
  Download,
  Shield,
  GraduationCap
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

function Users() {
  // Lấy thông tin user hiện tại từ localStorage
  let currentUser = null;
  try {
    const stored = localStorage.getItem('user');
    currentUser = stored ? JSON.parse(stored) : null;
  } catch {
    currentUser = null;
  }

  // Danh sách người dùng & trạng thái tải
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Bộ lọc vai trò & tìm kiếm
  const [selectedRole, setSelectedRole] = useState(''); // '' = Tất cả, 'LECTURER', 'STUDENT', 'ADMIN'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Trạng thái thao tác đang thực hiện trên từng dòng (id user)
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal Cấp tài khoản mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '123456',
    role: 'STUDENT',
  });

  // Modal Import CSV
  const [showImportModal, setShowImportModal] = useState(false);
  const [submittingImport, setSubmittingImport] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [csvContentText, setCsvContentText] = useState('');
  const fileInputRef = useRef(null);

  // Debounce ô tìm kiếm (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 1. Tải danh sách người dùng từ API: GET /api/users?role=...&search=...
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedRole) {
        params.role = selectedRole;
      }
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const res = await axiosClient.get('/users', { params });
      const userList = res.data?.users || res.users || (Array.isArray(res) ? res : []);
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Không thể tải danh sách tài khoản.';
      setError(msg);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRole, debouncedSearch]);

  // Gọi fetchUsers thông qua async runner có isMounted flag để tuân thủ React Hooks
  useEffect(() => {
    let isMounted = true;
    const loadUsers = async () => {
      if (isMounted) {
        await fetchUsers();
      }
    };
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [fetchUsers]);

  // Tự động ẩn thông báo thành công sau 4 giây
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 2. Thao tác: Cấp tài khoản mới (POST /api/users)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.username.trim()) {
      setCreateError('Vui lòng nhập Username / MSSV!');
      return;
    }

    setSubmittingCreate(true);
    setCreateError('');

    try {
      await axiosClient.post('/users', {
        username: createForm.username.trim().toLowerCase(),
        password: createForm.password || '123456',
        role: createForm.role,
        fullName: createForm.fullName.trim() || null,
        email: createForm.email.trim() || null,
      });

      setSuccessMessage(`Cấp tài khoản "${createForm.username.trim()}" thành công! Mật khẩu khởi tạo: ${createForm.password || '123456'}`);
      setShowCreateModal(false);
      setCreateForm({
        username: '',
        fullName: '',
        email: '',
        password: '123456',
        role: 'STUDENT',
      });
      await fetchUsers();
    } catch (err) {
      console.error('Lỗi khi tạo tài khoản:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Không thể tạo tài khoản mới!';
      setCreateError(msg);
    } finally {
      setSubmittingCreate(false);
    }
  };

  // 3. Thao tác: Chọn file CSV và đọc nội dung
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Vui lòng chọn file định dạng .csv');
      setSelectedFileName('');
      setCsvContentText('');
      return;
    }

    setSelectedFileName(file.name);
    setImportError('');
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setCsvContentText(String(text));
    };
    reader.onerror = () => {
      setImportError('Không thể đọc file CSV đã chọn!');
    };
    reader.readAsText(file, 'UTF-8');
  };

  // 4. Thao tác: Gửi dữ liệu CSV (POST /api/users/import-csv)
  const handleImportCsv = async (e) => {
    e.preventDefault();
    if (!csvContentText.trim()) {
      setImportError('Vui lòng chọn một file .csv hợp lệ có nội dung!');
      return;
    }

    setSubmittingImport(true);
    setImportError('');
    setImportResult(null);

    try {
      const res = await axiosClient.post('/users/import-csv', {
        csvContent: csvContentText,
        csv: csvContentText,
      });

      const result = res.data || res;
      setImportResult(result);
      setSuccessMessage(`Import hoàn tất: ${result.importedCount ?? 0}/${result.total ?? 0} tài khoản thành công!`);
      await fetchUsers();
    } catch (err) {
      console.error('Lỗi khi import CSV:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Import danh sách người dùng thất bại!';
      setImportError(msg);
    } finally {
      setSubmittingImport(false);
    }
  };

  // Tải file mẫu CSV
  const handleDownloadSampleCsv = () => {
    const sample = 
      'username,full_name,email,role,password\r\n' +
      '21020001,Nguyễn Văn An,an.nv21@vnu.edu.vn,STUDENT,123456\r\n' +
      '21020002,Trần Thị Mai Lan,lan.ttm21@vnu.edu.vn,STUDENT,123456\r\n' +
      'gv_nguyenan,TS. Nguyễn Văn An,nguyenvanan@vnu.edu.vn,LECTURER,123456\r\n' +
      'gv_lethanh,ThS. Lê Thành,lethanh@vnu.edu.vn,LECTURER,123456\r\n';

    const blob = new Blob(['\uFEFF' + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'smartclass_users_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 5. Thao tác: Reset mật khẩu về 123456 (POST /api/users/:id/reset-password)
  const handleResetPassword = async (user) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${user.username}" về "123456"?`);
    if (!confirmed) return;

    setActionLoadingId(user.id);
    try {
      const res = await axiosClient.post(`/users/${user.id}/reset-password`, {
        newPassword: '123456',
      });
      const defPass = res.data?.defaultPassword || '123456';
      setSuccessMessage(`Mật khẩu tài khoản "${user.username}" đã được đặt lại về "${defPass}" thành công!`);
      await fetchUsers();
    } catch (err) {
      console.error('Lỗi khi reset mật khẩu:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Không thể đặt lại mật khẩu!';
      alert(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 6. Thao tác: Gỡ thiết bị (POST /api/users/:id/unbind-device)
  const handleUnbindDevice = async (user) => {
    if (!user.device_id) {
      alert('Tài khoản này hiện chưa liên kết thiết bị nào.');
      return;
    }

    const confirmed = window.confirm(`Hủy liên kết thiết bị cho tài khoản "${user.username}"? Người dùng sẽ được phép đăng nhập lại trên thiết bị mới.`);
    if (!confirmed) return;

    setActionLoadingId(user.id);
    try {
      await axiosClient.post(`/users/${user.id}/unbind-device`);
      setSuccessMessage(`Đã hủy liên kết thiết bị của tài khoản "${user.username}" thành công!`);
      await fetchUsers();
    } catch (err) {
      console.error('Lỗi khi gỡ thiết bị:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Không thể hủy liên kết thiết bị!';
      alert(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 7. Thao tác: Khóa / Mở khóa tài khoản (PATCH /api/users/:id/toggle-lock)
  const handleToggleLock = async (user) => {
    if (currentUser?.id === user.id) {
      alert('Bạn không thể tự khóa tài khoản Admin đang đăng nhập!');
      return;
    }

    const nextLocked = !user.is_locked;
    const actionText = nextLocked ? 'Khóa' : 'Mở khóa';
    const confirmed = window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản "${user.username}"?`);
    if (!confirmed) return;

    setActionLoadingId(user.id);
    try {
      await axiosClient.patch(`/users/${user.id}/toggle-lock`, {
        isLocked: nextLocked,
      });
      setSuccessMessage(`${actionText} tài khoản "${user.username}" thành công!`);
      await fetchUsers();
    } catch (err) {
      console.error('Lỗi khi khóa/mở khóa tài khoản:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || `Không thể ${actionText.toLowerCase()} tài khoản!`;
      alert(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Thống kê nhanh
  const totalCount = users.length;
  const lecturerCount = users.filter((u) => u.role === 'LECTURER').length;
  const studentCount = users.filter((u) => u.role === 'STUDENT').length;
  const lockedCount = users.filter((u) => u.is_locked).length;

  return (
    <div style={{ padding: '24px', maxWidth: '1320px', margin: '0 auto' }}>
      {/* 1. Tiêu đề trang & Nút hành động chính */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#081c36', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UsersIcon size={26} color="#0068ff" /> Quản Lý Người Dùng & Tài Khoản
          </h1>
          <p style={{ fontSize: '13px', color: '#7589a3', margin: 0 }}>
            Quản trị danh sách người dùng toàn trường, cấp tài khoản, nhập danh sách CSV, gỡ liên kết thiết bị và khóa/mở khóa truy cập.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Nút Làm mới */}
          <button
            onClick={fetchUsers}
            disabled={loading}
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
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>

          {/* Nút Import CSV */}
          <button
            onClick={() => {
              setImportError('');
              setImportResult(null);
              setSelectedFileName('');
              setCsvContentText('');
              setShowImportModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#0068ff',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <FileSpreadsheet size={18} />
            Import CSV
          </button>

          {/* Nút Cấp tài khoản mới */}
          <button
            onClick={() => {
              setCreateError('');
              setShowCreateModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0068ff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 104, 255, 0.2)',
            }}
          >
            <UserPlus size={18} /> Cấp tài khoản mới
          </button>
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
          <button onClick={fetchUsers} style={{ marginLeft: 'auto', background: 'none', border: 'underline', color: '#ef4444', cursor: 'pointer', fontWeight: '600' }}>
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Thẻ thống kê nhanh số lượng người dùng */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#e5efff', color: '#0068ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UsersIcon size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#7589a3', fontWeight: '500', textTransform: 'uppercase' }}>Tổng tài khoản</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#081c36', margin: 0 }}>{totalCount}</h3>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#7589a3', fontWeight: '500', textTransform: 'uppercase' }}>Giảng viên (GV)</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#081c36', margin: 0 }}>{lecturerCount}</h3>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UsersIcon size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#7589a3', fontWeight: '500', textTransform: 'uppercase' }}>Sinh viên (SV)</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#081c36', margin: 0 }}>{studentCount}</h3>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#7589a3', fontWeight: '500', textTransform: 'uppercase' }}>Đang bị khóa</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#081c36', margin: 0 }}>{lockedCount}</h3>
          </div>
        </div>
      </div>

      {/* 4. Bộ lọc vai trò & Thanh tìm kiếm */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '18px 20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Tabs bộ lọc Vai trò */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#7589a3', marginRight: '4px' }}>Vai trò:</span>
            {[
              { label: 'Tất cả', value: '' },
              { label: 'Giảng viên', value: 'LECTURER' },
              { label: 'Sinh viên', value: 'STUDENT' },
              { label: 'Quản trị viên', value: 'ADMIN' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedRole(tab.value)}
                style={{
                  border: 'none',
                  backgroundColor: selectedRole === tab.value ? '#0068ff' : '#f1f5f9',
                  color: selectedRole === tab.value ? '#ffffff' : '#475569',
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

          {/* Ô tìm kiếm theo tên, username, email */}
          <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '420px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, username / MSSV, email..."
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

      {/* 5. Bảng danh sách người dùng */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e1e4e8', color: '#475569', fontWeight: '600' }}>
                <th style={{ padding: '14px 16px', width: '50px' }}>STT</th>
                <th style={{ padding: '14px 16px' }}>Tài khoản / Họ tên</th>
                <th style={{ padding: '14px 16px' }}>Email</th>
                <th style={{ padding: '14px 16px' }}>Vai trò</th>
                <th style={{ padding: '14px 16px' }}>Liên kết thiết bị</th>
                <th style={{ padding: '14px 16px' }}>Trạng thái</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', minWidth: '180px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 0', textAlign: 'center', color: '#0068ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={22} className="animate-spin" />
                      <span>Đang tải danh sách tài khoản...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#7589a3' }}>
                    <UsersIcon size={36} style={{ margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                    <p style={{ margin: 0, fontWeight: '500' }}>Không tìm thấy người dùng nào phù hợp</p>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => {
                  const isCurrentAdmin = currentUser?.id === user.id;
                  const isBusy = actionLoadingId === user.id;
                  
                  // Role Badge
                  let roleBg = '#e2e8f0';
                  let roleColor = '#475569';
                  let roleText = 'Sinh viên';
                  if (user.role === 'ADMIN') {
                    roleBg = '#f3e8ff';
                    roleColor = '#7e22ce';
                    roleText = 'Quản trị viên';
                  } else if (user.role === 'LECTURER') {
                    roleBg = '#e5efff';
                    roleColor = '#0068ff';
                    roleText = 'Giảng viên';
                  }

                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}>
                      {/* STT */}
                      <td style={{ padding: '14px 16px', color: '#7589a3' }}>{idx + 1}</td>

                      {/* Tài khoản / Họ tên */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: roleBg, color: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                            {(user.username || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', color: '#081c36', display: 'block' }}>
                              {user.full_name || user.fullName || '(Chưa đặt tên)'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#0068ff', fontFamily: 'monospace', fontWeight: '600' }}>
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 16px', color: '#475569' }}>
                        {user.email || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>}
                      </td>

                      {/* Vai trò */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: roleBg, color: roleColor, padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>
                          <Shield size={12} /> {roleText}
                        </span>
                      </td>

                      {/* Liên kết thiết bị */}
                      <td style={{ padding: '14px 16px' }}>
                        {user.device_id ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 8px', borderRadius: '8px', fontSize: '11px' }}>
                            <Smartphone size={14} style={{ color: '#2563eb' }} />
                            <span style={{ fontFamily: 'monospace' }} title={user.device_id}>
                              {user.device_id.slice(0, 10)}...
                            </span>
                          </div>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '11px' }}>
                            <Smartphone size={13} /> Chưa liên kết
                          </span>
                        )}
                      </td>

                      {/* Trạng thái khóa */}
                      <td style={{ padding: '14px 16px' }}>
                        {user.is_locked ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>
                            <Lock size={12} /> Đã khóa
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>
                            <CheckCircle2 size={12} /> Hoạt động
                          </span>
                        )}
                      </td>

                      {/* 3 Nút thao tác */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {/* 1. Reset mật khẩu về 123456 */}
                          <button
                            onClick={() => handleResetPassword(user)}
                            disabled={isBusy}
                            title="Đặt lại mật khẩu về 123456"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '6px 9px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '500',
                            }}
                          >
                            <KeyRound size={14} style={{ marginRight: '4px' }} />
                            Reset Pass
                          </button>

                          {/* 2. Gỡ thiết bị */}
                          <button
                            onClick={() => handleUnbindDevice(user)}
                            disabled={isBusy || !user.device_id}
                            title={user.device_id ? 'Hủy liên kết thiết bị' : 'Người dùng chưa liên kết thiết bị'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: user.device_id ? '#fff7ed' : '#f8fafc',
                              color: user.device_id ? '#c2410c' : '#94a3b8',
                              border: user.device_id ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '6px 9px',
                              cursor: user.device_id ? 'pointer' : 'not-allowed',
                              fontSize: '11px',
                              fontWeight: '500',
                              opacity: user.device_id ? 1 : 0.6,
                            }}
                          >
                            <Smartphone size={14} style={{ marginRight: '4px' }} />
                            Gỡ thiết bị
                          </button>

                          {/* 3. Khóa / Mở khóa tài khoản */}
                          <button
                            onClick={() => handleToggleLock(user)}
                            disabled={isBusy || isCurrentAdmin}
                            title={isCurrentAdmin ? 'Không thể khóa chính mình' : user.is_locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: user.is_locked ? '#f0fdf4' : '#fef2f2',
                              color: user.is_locked ? '#16a34a' : '#ef4444',
                              border: user.is_locked ? '1px solid #bbf7d0' : '1px solid #fecaca',
                              borderRadius: '8px',
                              padding: '6px 9px',
                              cursor: isCurrentAdmin ? 'not-allowed' : 'pointer',
                              fontSize: '11px',
                              fontWeight: '600',
                              opacity: isCurrentAdmin ? 0.5 : 1,
                            }}
                          >
                            {user.is_locked ? (
                              <>
                                <Unlock size={14} style={{ marginRight: '4px' }} />
                                Mở khóa
                              </>
                            ) : (
                              <>
                                <Lock size={14} style={{ marginRight: '4px' }} />
                                Khóa
                              </>
                            )}
                          </button>
                        </div>
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
      {/* 6. MODAL CẤP TÀI KHOẢN MỚI                                 */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e5efff', color: '#0068ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#081c36', margin: 0 }}>Cấp Tài Khoản Mới</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#ef4444', fontSize: '12px', marginBottom: '14px' }}>
                <AlertCircle size={16} className="shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Tên đăng nhập (Username / MSSV) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 221A290065 (SV) hoặc 221B290065 (GV)"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Họ và tên
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Ví dụ: an.nv@vnu.edu.vn"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Mật khẩu ban đầu
                </label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Mặc định: 123456"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '13px', outline: 'none' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Để trống hoặc giữ nguyên để gán mật khẩu mặc định <strong>123456</strong>.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Vai trò (Role) *
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '13px', outline: 'none' }}
                >
                  <option value="STUDENT">Sinh viên (STUDENT)</option>
                  <option value="LECTURER">Giảng viên (LECTURER)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  style={{ backgroundColor: '#0068ff', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: submittingCreate ? 0.7 : 1 }}
                >
                  {submittingCreate ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. MODAL IMPORT DANH SÁCH CSV                              */}
      {/* ========================================================= */}
      {showImportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#081c36', margin: 0 }}>Import Người Dùng Từ CSV</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Thêm tài khoản hàng loạt cho sinh viên hoặc giảng viên</p>
                </div>
              </div>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Hướng dẫn cấu trúc file CSV */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', fontSize: '12px', color: '#334155', marginBottom: '16px' }}>
              <span style={{ fontWeight: '600', display: 'block', marginBottom: '4px', color: '#0f172a' }}>
                Cấu trúc các cột được hỗ trợ:
              </span>
              <ul style={{ margin: '0 0 8px 0', paddingLeft: '18px', color: '#475569', lineHeight: 1.5 }}>
                <li><strong>Tiêu đề tiếng Việt:</strong> <code>mssv</code> (hoặc <code>ma_sv</code>), <code>ho_ten</code>, <code>email</code>, <code>vai_tro</code> (STUDENT / LECTURER), <code>mat_khau</code>.</li>
                <li><strong>Tiêu đề tiếng Anh:</strong> <code>username</code>, <code>full_name</code>, <code>email</code>, <code>role</code>, <code>password</code>.</li>
              </ul>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Mật khẩu mặc định là <strong>123456</strong> nếu để trống.</span>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', color: '#0068ff', cursor: 'pointer' }}
                >
                  <Download size={13} /> Tải file mẫu CSV
                </button>
              </div>
            </div>

            {importError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#ef4444', fontSize: '12px', marginBottom: '14px' }}>
                <AlertCircle size={16} className="shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Form chọn file CSV */}
            <form onSubmit={handleImportCsv} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <FileSpreadsheet size={36} style={{ color: '#0284c7', margin: '0 auto 8px auto' }} />
                {selectedFileName ? (
                  <div>
                    <span style={{ fontWeight: '600', color: '#0f172a', display: 'block', fontSize: '13px' }}>{selectedFileName}</span>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '500' }}>✓ Đã tải nội dung file sẵn sàng</span>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0068ff', display: 'block' }}>Nhấn để chọn file .csv</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Hỗ trợ file mã hóa UTF-8 tiếng Việt</span>
                  </div>
                )}
              </div>

              {/* Bảng kết quả import nếu có */}
              {importResult && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 14px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: '600', marginBottom: '6px' }}>
                    <CheckCircle2 size={16} />
                    <span>Import thành công: {importResult.importedCount} / {importResult.total} tài khoản</span>
                  </div>
                  {importResult.failedCount > 0 && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid #bbf7d0', paddingTop: '8px' }}>
                      <span style={{ color: '#dc2626', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        {importResult.failedCount} dòng gặp lỗi:
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: '#b91c1c', maxHeight: '100px', overflowY: 'auto' }}>
                        {importResult.errors?.map((err, i) => (
                          <li key={i}>Dòng {err.row} ({err.username}): {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingImport || !csvContentText}
                  style={{ backgroundColor: '#0068ff', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: (submittingImport || !csvContentText) ? 0.6 : 1 }}
                >
                  {submittingImport ? 'Đang import...' : 'Bắt đầu Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
