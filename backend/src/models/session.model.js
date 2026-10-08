/**
 * Session Model - Tầng Data Access cho bảng `sessions` (phiên điểm danh).
 *
 * Tọa độ được lưu bằng PostGIS: GEOMETRY(Point, 4326)
 *   - SRID 4326 = hệ tọa độ WGS84 (chuẩn GPS của điện thoại / Google Maps).
 *   - ST_MakePoint nhận (KINH ĐỘ, VĨ ĐỘ) = (x, y)  ->  CHÚ Ý thứ tự: longitude trước!
 */
const pool = require('../config/database');

/**
 * Trạng thái phiên được TÍNH từ thời gian (không lưu cứng) => không bao giờ bị lệch:
 *   CLOSED  : GV đã đóng thủ công
 *   ACTIVE  : đang trong khung giờ điểm danh
 *   EXPIRED : đã quá end_time
 */
const STATUS_SQL = `
    CASE
        WHEN s.closed_at IS NOT NULL THEN 'CLOSED'
        WHEN NOW() < s.end_time      THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END
`;

const BASE_SELECT = `
    SELECT s.id,
           s.course_id,
           c.code               AS course_code,
           c.name               AS course_name,
           s.lecturer_id,
           u.username           AS lecturer_username,
           ST_Y(s.location)     AS latitude,
           ST_X(s.location)     AS longitude,
           s.ip_range::text     AS ip_range,
           s.radius_meters,
           s.late_after_minutes,
           s.start_time,
           s.end_time,
           s.closed_at,
           ${STATUS_SQL}        AS status,
           s.created_at
    FROM sessions s
    JOIN courses c    ON c.id = s.course_id
    LEFT JOIN users u ON u.id = s.lecturer_id
`;

/** Điều kiện "phiên đang mở" dùng chung */
const ACTIVE_CONDITION = 's.closed_at IS NULL AND NOW() < s.end_time';

const findById = async (id, db = pool) => {
    const { rows } = await db.query(`${BASE_SELECT} WHERE s.id = $1`, [id]);
    return rows[0] || null;
};

const findByCourse = async (courseId) => {
    const { rows } = await pool.query(
        `${BASE_SELECT} WHERE s.course_id = $1 ORDER BY s.start_time DESC`,
        [courseId]
    );
    return rows;
};

const findActiveByCourse = async (courseId, db = pool) => {
    const { rows } = await db.query(
        `${BASE_SELECT} WHERE s.course_id = $1 AND ${ACTIVE_CONDITION} LIMIT 1`,
        [courseId]
    );
    return rows[0] || null;
};

/**
 * Khóa dòng `courses` tương ứng tới hết transaction (SELECT ... FOR UPDATE).
 * Mục đích: nếu GV bấm "Mở phiên" 2 lần liên tiếp (hoặc mở trên 2 thiết bị),
 * request thứ 2 phải CHỜ request thứ 1 xong => không thể tạo ra 2 phiên cùng lúc.
 */
const lockCourse = async (courseId, db) => {
    await db.query('SELECT id FROM courses WHERE id = $1 FOR UPDATE', [courseId]);
};

/**
 * Tạo phiên bắt đầu NGAY LÚC NÀY, kết thúc sau durationMinutes phút.
 * Dùng NOW() của DB (không dùng giờ của Node) để mọi so sánh thời gian đều cùng 1 đồng hồ.
 * network($x::inet) chuẩn hóa dải IP, vd: 192.168.1.5/24 -> 192.168.1.0/24.
 * @returns {Promise<number>} id phiên vừa tạo
 */
const create = async ({
    courseId, lecturerId, latitude, longitude, ipRange,
    radiusMeters, lateAfterMinutes, durationMinutes,
}, db = pool) => {
    const { rows } = await db.query(
        `INSERT INTO sessions
            (course_id, lecturer_id, location, ip_range,
             radius_meters, late_after_minutes, start_time, end_time)
         VALUES
            ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), network($5::inet),
             $6, $7, NOW(), NOW() + make_interval(mins => $8))
         RETURNING id`,
        [courseId, lecturerId, longitude, latitude, ipRange,
            radiusMeters, lateAfterMinutes, durationMinutes]
    );
    return rows[0].id;
};

/**
 * Đóng phiên sớm: ghi nhận closed_at và kéo end_time về hiện tại.
 * @returns {Promise<boolean>} false nếu phiên đã đóng/hết hạn từ trước
 */
const close = async (id) => {
    const { rowCount } = await pool.query(
        `UPDATE sessions s
         SET closed_at = NOW(), end_time = NOW()
         WHERE s.id = $1 AND ${ACTIVE_CONDITION}`,
        [id]
    );
    return rowCount > 0;
};

module.exports = {
    findById,
    findByCourse,
    findActiveByCourse,
    lockCourse,
    create,
    close,
};
