/**
 * Auth Service - Tầng nghiệp vụ cho Đăng ký / Đăng nhập / Xác thực token.
 * Không phụ thuộc vào Express (req/res) => dễ tái sử dụng và viết unit test.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const jwtConfig = require('../config/jwt');
const AppError = require('../utils/AppError');
const PG_ERROR = require('../utils/pgErrors');

/**
 * Hash giả dùng khi username không tồn tại.
 * Mục đích: luôn chạy bcrypt.compare dù user có tồn tại hay không,
 * để thời gian phản hồi như nhau => kẻ tấn công không thể đoán
 * username nào tồn tại dựa vào tốc độ phản hồi (timing attack).
 */
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-safety', jwtConfig.saltRounds);

/**
 * Tạo JWT cho user.
 * Payload chỉ chứa thông tin tối thiểu (id, role) - KHÔNG đưa dữ liệu nhạy cảm vào
 * vì payload JWT chỉ được mã hóa Base64, ai cũng có thể decode để đọc.
 * Chữ ký (signature) được tạo bằng HMAC-SHA256 với JWT_SECRET, đảm bảo
 * token không thể bị sửa đổi nếu không biết secret.
 */
const generateToken = (user) => {
    return jwt.sign(
        { sub: user.id, role: user.role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
    );
};

/**
 * Tạo tài khoản (mã hóa mật khẩu + lưu DB). KHÔNG kiểm tra quyền.
 * Dùng chung cho: API đăng ký (register) và script seed tài khoản ADMIN.
 * @returns {Promise<object>} user (không có password_hash)
 */
const createAccount = async ({ username, password, role }) => {
    const existing = await userModel.findByUsername(username);
    if (existing) {
        throw new AppError('Username already exists', 409);
    }

    // bcrypt tự sinh salt ngẫu nhiên và nhúng vào chuỗi hash,
    // nên 2 user cùng mật khẩu vẫn có hash khác nhau.
    const passwordHash = await bcrypt.hash(password, jwtConfig.saltRounds);

    try {
        return await userModel.create({ username, passwordHash, role });
    } catch (err) {
        // Phòng trường hợp 2 request đăng ký cùng username chạy song song (race condition):
        // cả hai đều qua bước kiểm tra ở trên, nhưng DB UNIQUE constraint sẽ chặn request thứ 2.
        if (err.code === PG_ERROR.UNIQUE_VIOLATION) {
            throw new AppError('Username already exists', 409);
        }
        throw err;
    }
};

/**
 * Đăng ký tài khoản mới.
 * @returns {Promise<{user: object, token: string}>}
 */
const register = async ({ username, password, role }) => {
    const user = await createAccount({ username, password, role });
    return { user, token: generateToken(user) };
};

/**
 * Đăng nhập.
 * Dùng chung 1 thông báo lỗi cho cả "sai username" và "sai password"
 * để không làm lộ thông tin username nào đang tồn tại.
 * @returns {Promise<{user: object, token: string}>}
 */
const login = async ({ username, password }) => {
    const user = await userModel.findByUsernameWithPassword(username);

    const isMatch = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !isMatch) {
        throw new AppError('Invalid username or password', 401);
    }

    // Loại bỏ password_hash trước khi trả về
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token: generateToken(safeUser) };
};

/**
 * Xác thực token và trả về payload đã giải mã.
 * jwt.verify kiểm tra: (1) chữ ký hợp lệ, (2) token chưa hết hạn (exp).
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new AppError('Token has expired', 401);
        }
        throw new AppError('Invalid token', 401);
    }
};

/**
 * Lấy thông tin user hiện tại từ id trong token.
 */
const getCurrentUser = async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
};

module.exports = {
    createAccount,
    register,
    login,
    verifyToken,
    getCurrentUser,
};
