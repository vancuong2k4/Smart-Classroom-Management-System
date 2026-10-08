/**
 * Tiện ích xử lý địa chỉ mạng (IP / CIDR).
 */
const net = require('net');

/**
 * Kiểm tra & chuẩn hóa một dải IP dạng CIDR.
 *   "192.168.1.0/24" -> "192.168.1.0/24"
 *   "10.0.0.5"       -> "10.0.0.5/32"   (1 IP duy nhất)
 *   "2001:db8::/32"  -> "2001:db8::/32"
 * Phần "host bits" (vd: 192.168.1.5/24) sẽ được PostgreSQL chuẩn hóa về địa chỉ mạng
 * bằng hàm network() khi lưu.
 * @returns {string|null} CIDR hợp lệ, hoặc null nếu sai định dạng
 */
const normalizeCidr = (value) => {
    if (typeof value !== 'string') return null;

    const [address, prefix, ...rest] = value.trim().split('/');
    if (rest.length > 0) return null;

    const version = net.isIP(address); // 4, 6 hoặc 0 (không hợp lệ)
    if (version === 0) return null;

    const maxPrefix = version === 4 ? 32 : 128;
    if (prefix === undefined) return `${address}/${maxPrefix}`;

    if (!/^\d{1,3}$/.test(prefix) || Number(prefix) > maxPrefix) return null;
    return `${address}/${Number(prefix)}`;
};

module.exports = { normalizeCidr };
