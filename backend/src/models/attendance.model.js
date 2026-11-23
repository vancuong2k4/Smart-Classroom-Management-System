const pool = require('../config/database');

/**
 * Lấy thông tin phiên kèm theo khoảng cách và kiểm tra IP (Thực thi ngay trên Database).
 * - ST_DistanceSphere: Tính khoảng cách đường chim bay (mét) giữa 2 toạ độ GPS.
 * - Toán tử <<=: Kiểm tra xem IP của SV có nằm trong mạng CIDR của lớp không.
 */
const checkSessionContext = async (sessionId, lon, lat, ipAddress) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                s.id,
                s.course_id,
                s.session_number,
                c.code AS course_code,
                c.name AS course_name,
                s.start_time,
                s.end_time,
                s.closed_at,
                s.radius_meters,
                s.late_after_minutes,
                ST_DistanceSphere(s.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance_meters,
                (family($3::inet) = family(s.ip_range) AND $3::inet <<= s.ip_range) AS is_ip_valid,
                CASE
                    WHEN s.closed_at IS NOT NULL THEN 'CLOSED'
                    WHEN NOW() < s.end_time      THEN 'ACTIVE'
                    ELSE 'EXPIRED'
                END AS session_status
            FROM sessions s
            JOIN courses c ON c.id = s.course_id
            WHERE s.id = $4
        `, [lon, lat, ipAddress, sessionId]);
        return rows[0] || null;
    } catch (err) {
        if (err.code === '22P02') { 
            throw new Error('Invalid IP address format for DB');
        }
        throw err;
    }
};

/**
 * Lưu kết quả điểm danh. Sử dụng UPSERT (ON CONFLICT DO UPDATE).
 * Nếu sinh viên quét lại (cải thiện khoảng cách), dữ liệu sẽ được cập nhật.
 */
const upsertRecord = async ({ sessionId, studentId, lon, lat, ipAddress, status }) => {
    const { rows } = await pool.query(`
        INSERT INTO attendance_records (session_id, student_id, scanned_location, scanned_ip, status)
        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5::inet, $6)
        ON CONFLICT (session_id, student_id)
        DO UPDATE SET
            scanned_location = EXCLUDED.scanned_location,
            scanned_ip = EXCLUDED.scanned_ip,
            status = EXCLUDED.status,
            created_at = NOW()
        RETURNING *;
    `, [sessionId, studentId, lon, lat, ipAddress, status]);
    return rows[0];
};

/**
 * Lấy danh sách sinh viên đã điểm danh cho một phiên.
 */
const findBySession = async (sessionId) => {
    const { rows } = await pool.query(`
        SELECT a.id, a.student_id, u.username,
               ST_Y(a.scanned_location) as lat, ST_X(a.scanned_location) as lon,
               a.scanned_ip::text as ip_address, a.status, a.created_at
        FROM attendance_records a
        JOIN users u ON u.id = a.student_id
        WHERE a.session_id = $1
        ORDER BY a.created_at DESC
    `, [sessionId]);
    return rows;
};

/**
 * Lấy danh sách 100% sĩ số lớp của phiên điểm danh,
 * bao gồm cả sinh viên vắng mặt (ABSENT), có phép (EXCUSED), có mặt, muộn và lỗi vị trí.
 */
const getFullSessionRoster = async (sessionId) => {
    const { rows } = await pool.query(`
        SELECT
            u.id AS student_id,
            u.username,
            u.full_name,
            u.email,
            a.id AS record_id,
            COALESCE(a.status, 'ABSENT') AS status,
            a.created_at AS scanned_at,
            ST_Y(a.scanned_location) AS lat,
            ST_X(a.scanned_location) AS lon,
            a.scanned_ip::text AS ip_address,
            CASE
                WHEN a.scanned_location IS NOT NULL THEN
                    ROUND(ST_DistanceSphere(s.location, a.scanned_location)::numeric, 0)::int
                ELSE NULL
            END AS distance_meters
        FROM sessions s
        JOIN enrollments e ON e.course_id = s.course_id
        JOIN users u ON u.id = e.student_id
        LEFT JOIN attendance_records a ON a.session_id = s.id AND a.student_id = u.id
        WHERE s.id = $1
        ORDER BY
            CASE COALESCE(a.status, 'ABSENT')
                WHEN 'PRESENT' THEN 1
                WHEN 'LATE' THEN 2
                WHEN 'EXCUSED' THEN 3
                WHEN 'INVALID_LOCATION' THEN 4
                ELSE 5
            END,
            u.username ASC;
    `, [sessionId]);
    return rows;
};

module.exports = { checkSessionContext, upsertRecord, findBySession, getFullSessionRoster };
