/**
 * Script tạo tài khoản ADMIN đầu tiên.
 * Lý do cần script: API /api/auth/register KHÔNG cho tạo ADMIN (chống leo thang đặc quyền).
 *
 * Cách dùng:
 *   1. Đặt ADMIN_USERNAME và ADMIN_PASSWORD trong backend/.env
 *   2. Chạy: npm run seed:admin
 *
 * Script idempotent: chạy nhiều lần cũng không tạo trùng (đã tồn tại thì bỏ qua).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('../src/config/database');
const authService = require('../src/services/auth.service');
const ROLES = require('../src/constants/roles');

const PLACEHOLDER_PASSWORD = 'change_me_to_a_strong_password';
const MIN_ADMIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // giới hạn của bcrypt
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,50}$/;

const seedAdmin = async () => {
    const username = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || '';

    if (!USERNAME_REGEX.test(username)) {
        throw new Error('ADMIN_USERNAME is missing or invalid (3-50 chars: letters, numbers, "_", ".")');
    }
    if (password === PLACEHOLDER_PASSWORD) {
        throw new Error('ADMIN_PASSWORD is still the example value. Please set a real password in .env');
    }
    if (password.length < MIN_ADMIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        throw new Error(`ADMIN_PASSWORD must be ${MIN_ADMIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters`);
    }

    try {
        const admin = await authService.createAccount({ username, password, role: ROLES.ADMIN });
        console.log(`✅ Created ADMIN account: "${admin.username}" (id=${admin.id})`);
    } catch (err) {
        if (err.statusCode === 409) {
            console.log(`ℹ️  User "${username}" already exists. Nothing to do.`);
            return;
        }
        throw err;
    }
};

seedAdmin()
    .catch((err) => {
        console.error(`❌ Seed admin failed: ${err.message}`);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
