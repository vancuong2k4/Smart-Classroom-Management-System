DROP INDEX IF EXISTS idx_enrollments_course_id;
DROP INDEX IF EXISTS idx_courses_lecturer_id;
ALTER TABLE courses DROP COLUMN IF EXISTS lecturer_id;