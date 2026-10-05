/**
 * Cấu hình bảo mật cho Auth, đọc từ biến môi trường.
 * Fail-fast: nếu thiếu JWT_SECRET thì dừng server ngay,
 * tránh trường hợp ký token với secret rỗng/undefined.
 */
if (!process.env.JWT_SECRET) {
    throw new Error('Missing required environment variable: JWT_SECRET');
}

module.exports = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
};
