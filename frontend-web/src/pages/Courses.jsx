import { useState } from 'react';
import { Plus, Search, BookOpen, Users, UserPlus, X, Trash2 } from 'lucide-react';

function Courses() {
  // Trạng thái lưu từ khóa tìm kiếm môn học
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trạng thái đóng/mở Modal tạo lớp học phần mới
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  
  // Trạng thái lớp học phần đang được chọn để xem chi tiết danh sách sinh viên
  const [selectedCourse, setSelectedCourse] = useState({ id: '1', code: 'WEB302', name: 'Lập trình Web nâng cao - Nhóm 01' });
  
  // Trạng thái Form tạo lớp học phần mới
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');

  // Trạng thái Form nhập thêm sinh viên (Username / MSSV)
  const [studentInput, setStudentInput] = useState('');

  // Danh sách môn học / lớp học phần mẫu
  const [courses, setCourses] = useState([
    { id: '1', code: 'WEB302', name: 'Lập trình Web nâng cao - Nhóm 01', totalStudents: 2 },
    { id: '2', code: 'WIN201', name: 'Lập trình Windows - Nhóm 02', totalStudents: 1 }
  ]);

  // Danh sách sinh viên thuộc lớp học phần đang chọn
  const [students, setStudents] = useState([
    { id: 'SV01', username: '231A010203', fullName: 'Nguyễn Trần Anh Thư', email: 'thu231a010203@vhu.edu.vn' },
    { id: 'SV02', username: '231A010204', fullName: 'Trần Văn Cường', email: 'cuong231a010204@vhu.edu.vn' }
  ]);

  // Hàm xử lý tạo lớp học phần mới
  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!newCourseName.trim() || !newCourseCode.trim()) return;
    
    const newCourse = {
      id: Date.now().toString(),
      code: newCourseCode.toUpperCase().trim(),
      name: newCourseName.trim(),
      totalStudents: 0
    };

    setCourses([newCourse, ...courses]);
    setSelectedCourse(newCourse);
    setNewCourseName('');
    setNewCourseCode('');
    setShowAddCourseModal(false);
  };

  // Hàm xử lý thêm sinh viên mới vào lớp bằng Username / MSSV
  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!studentInput.trim()) return;

    const newStudent = {
      id: `SV-${Date.now()}`,
      username: studentInput.trim(),
      fullName: `Sinh viên ${studentInput.trim()}`,
      email: `${studentInput.trim().toLowerCase()}@vhu.edu.vn`
    };

    setStudents([...students, newStudent]);
    setStudentInput('');
  };

  // Hàm xử lý xóa sinh viên khỏi lớp học phần
  const handleDeleteStudent = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sinh viên này khỏi lớp học phần?')) {
      setStudents(students.filter(student => student.id !== id));
    }
  };

  // Lọc danh sách lớp học theo từ khóa tìm kiếm
  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Tiêu đề trang & Nút bật Modal tạo khóa học */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#081c36', margin: '0 0 4px 0' }}>Quản lý Khóa học & Lớp học phần</h1>
          <p style={{ fontSize: '13px', color: '#7589a3', margin: 0 }}>Danh sách các lớp học phần và quản lý tiến trình điểm danh sinh viên.</p>
        </div>
        <button 
          onClick={() => setShowAddCourseModal(true)}
          style={{ backgroundColor: '#0068ff', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 104, 255, 0.2)' }}
        >
          <Plus size={18} /> Thêm Khóa học
        </button>
      </div>

      {/* Thanh tìm kiếm môn học / mã lớp */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '16px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', color: '#7589a3' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm môn học, mã lớp học phần..."
            style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '12px', border: '1px solid #e1e4e8', backgroundColor: '#f5f7fb', fontSize: '14px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Danh sách các Card Khóa học */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {filteredCourses.map((course) => (
          <div 
            key={course.id}
            onClick={() => setSelectedCourse(course)}
            style={{ 
              backgroundColor: '#ffffff', 
              border: selectedCourse?.id === course.id ? '2px solid #0068ff' : '1px solid #e1e4e8', 
              borderRadius: '16px', 
              padding: '20px', 
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#e5efff', color: '#0068ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#0068ff', backgroundColor: '#e5efff', padding: '2px 8px', borderRadius: '6px' }}>{course.code}</span>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#081c36', margin: '4px 0 0 0' }}>{course.name}</h3>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7589a3', borderTop: '1px solid #f0f2f5', paddingTop: '12px', marginTop: '12px' }}>
              <Users size={14} />
              <span>Sĩ số: {selectedCourse?.id === course.id ? students.length : course.totalStudents} sinh viên</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bảng Quản lý Danh sách Sinh viên thuộc lớp đang được chọn */}
      {selectedCourse && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', borderBottom: '1px solid #e1e4e8', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#081c36', margin: 0 }}>
                Danh sách Sinh viên: {selectedCourse.name}
              </h2>
              <p style={{ fontSize: '12px', color: '#7589a3', margin: '2px 0 0 0' }}>Quản lý và nhập danh sách tài khoản sinh viên thuộc lớp học phần</p>
            </div>

            {/* Form Thêm Sinh viên bằng MSSV/Username */}
            <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                placeholder="Nhập MSSV / Username..."
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e1e4e8', backgroundColor: '#f5f7fb', fontSize: '13px', outline: 'none' }}
              />
              <button 
                type="submit"
                style={{ backgroundColor: '#0068ff', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <UserPlus size={16} /> Thêm SV
              </button>
            </form>
          </div>

          {/* Table Danh sách sinh viên */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f7fb', borderBottom: '1px solid #e1e4e8', color: '#081c36', fontWeight: '600' }}>
                  <th style={{ padding: '12px 16px' }}>STT</th>
                  <th style={{ padding: '12px 16px' }}>Mã Sinh Viên (Username)</th>
                  <th style={{ padding: '12px 16px' }}>Họ và Tên</th>
                  <th style={{ padding: '12px 16px' }}>Email Nhà Trường</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '12px 16px', color: '#7589a3' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0068ff' }}>{student.username}</td>
                    <td style={{ padding: '12px 16px', color: '#081c36', fontWeight: '500' }}>{student.fullName}</td>
                    <td style={{ padding: '12px 16px', color: '#7589a3' }}>{student.email}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Popup Tạo Khóa Học Mới */}
      {showAddCourseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#081c36', margin: 0 }}>Tạo Khóa Học Phần Mới</h3>
              <button onClick={() => setShowAddCourseModal(false)} style={{ background: 'none', border: 'none', color: '#7589a3', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#081c36', marginBottom: '4px' }}>Mã môn học / Lớp phần *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: WEB302..."
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e1e4e8', backgroundColor: '#f5f7fb', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#081c36', marginBottom: '4px' }}>Tên môn học / Nhóm lớp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình Web nâng cao - Nhóm 01..."
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e1e4e8', backgroundColor: '#f5f7fb', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  style={{ backgroundColor: '#f5f7fb', color: '#081c36', border: '1px solid #e1e4e8', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#0068ff', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Tạo lớp ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;