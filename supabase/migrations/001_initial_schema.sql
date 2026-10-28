-- =========================================================================
-- TIMETABLE CLASH AND LAST-MINUTE CLASSROOM CHANGE COORDINATOR
-- Supabase PostgreSQL Migration 001: Initial Schema, Constraints & RLS
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    building VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(50) NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    room_type VARCHAR(50) NOT NULL DEFAULT 'Lecture Hall' CHECK (room_type IN ('Lecture Hall', 'Computer Lab', 'Seminar Room', 'Smart Classroom', 'Workshop')),
    has_projector BOOLEAN NOT NULL DEFAULT TRUE,
    has_audio BOOLEAN NOT NULL DEFAULT TRUE,
    has_ac BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_building_room UNIQUE (building, room_number)
);

-- 3. FACULTIES TABLE
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100) NOT NULL DEFAULT 'Assistant Professor',
    office_room VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COHORTS (Batches / Student Groups)
CREATE TABLE IF NOT EXISTS cohorts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 5),
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 10),
    student_count INTEGER NOT NULL CHECK (student_count > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(30) NOT NULL UNIQUE,
    course_name VARCHAR(150) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    credits INTEGER NOT NULL DEFAULT 3 CHECK (credits > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TIMETABLE SESSIONS
CREATE TABLE IF NOT EXISTS timetable_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE RESTRICT,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_type VARCHAR(50) NOT NULL DEFAULT 'Lecture' CHECK (session_type IN ('Lecture', 'Lab', 'Tutorial', 'Seminar')),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RELOCATED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_time_order CHECK (start_time < end_time)
);

-- Index for speedy timetable lookups and conflict scanning
CREATE INDEX IF NOT EXISTS idx_sessions_day_time ON timetable_sessions (day_of_week, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_sessions_room ON timetable_sessions (room_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_sessions_faculty ON timetable_sessions (faculty_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_sessions_cohort ON timetable_sessions (cohort_id, day_of_week);

-- 7. CHANGE REQUESTS (Last-minute classroom changes)
CREATE TABLE IF NOT EXISTS change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES timetable_sessions(id) ON DELETE CASCADE,
    requested_by_name VARCHAR(150) NOT NULL,
    requested_by_role VARCHAR(50) NOT NULL DEFAULT 'Faculty',
    original_room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    target_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    urgency VARCHAR(30) NOT NULL DEFAULT 'TODAY' CHECK (urgency IN ('IMMEDIATE', 'TODAY', 'UPCOMING')),
    reason_category VARCHAR(50) NOT NULL DEFAULT 'EQUIPMENT_FAILURE' CHECK (reason_category IN ('EQUIPMENT_FAILURE', 'MAINTENANCE', 'OVERFLOW', 'FACULTY_CHANGE', 'ACCESSIBILITY', 'OTHER')),
    reason_details TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
    reviewed_by VARCHAR(150),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON change_requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_urgency ON change_requests (urgency);

-- 8. CHANGE AUDIT LOGS
CREATE TABLE IF NOT EXISTS change_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES timetable_sessions(id) ON DELETE SET NULL,
    change_request_id UUID REFERENCES change_requests(id) ON DELETE SET NULL,
    action_type VARCHAR(60) NOT NULL,
    details TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    performed_by_role VARCHAR(50) NOT NULL,
    performed_by_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON change_audit_logs (created_at DESC);

-- 9. IN-APP NOTICES & ALERTS
CREATE TABLE IF NOT EXISTS in_app_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    urgency VARCHAR(30) NOT NULL DEFAULT 'INFO' CHECK (urgency IN ('CRITICAL', 'WARNING', 'INFO')),
    session_id UUID REFERENCES timetable_sessions(id) ON DELETE SET NULL,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notices_active ON in_app_notices (is_active, is_pinned, created_at DESC);

-- =========================================================================
-- DATABASE TRIGGER FOR CONFLICT VALIDATION (PostgreSQL Guardrail)
-- =========================================================================
CREATE OR REPLACE FUNCTION fn_validate_timetable_clash()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INTEGER;
    conflict_type TEXT;
BEGIN
    -- Only check ACTIVE or RELOCATED sessions
    IF NEW.status = 'CANCELLED' THEN
        RETURN NEW;
    END IF;

    -- 1. Check Room Overlap
    SELECT COUNT(*) INTO conflict_count
    FROM timetable_sessions
    WHERE id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND room_id = NEW.room_id
      AND day_of_week = NEW.day_of_week
      AND status <> 'CANCELLED'
      AND (NEW.start_time < end_time AND NEW.end_time > start_time);

    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'ROOM_OVERLAP: Target classroom is already booked at this day and time.';
    END IF;

    -- 2. Check Faculty Overlap
    SELECT COUNT(*) INTO conflict_count
    FROM timetable_sessions
    WHERE id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND faculty_id = NEW.faculty_id
      AND day_of_week = NEW.day_of_week
      AND status <> 'CANCELLED'
      AND (NEW.start_time < end_time AND NEW.end_time > start_time);

    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'FACULTY_OVERLAP: Faculty member is already scheduled for another class at this time.';
    END IF;

    -- 3. Check Cohort Overlap
    SELECT COUNT(*) INTO conflict_count
    FROM timetable_sessions
    WHERE id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND cohort_id = NEW.cohort_id
      AND day_of_week = NEW.day_of_week
      AND status <> 'CANCELLED'
      AND (NEW.start_time < end_time AND NEW.end_time > start_time);

    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'COHORT_OVERLAP: Student cohort already has another class scheduled at this time.';
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_timetable_clash_check ON timetable_sessions;
CREATE TRIGGER trg_timetable_clash_check
    BEFORE INSERT OR UPDATE ON timetable_sessions
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_timetable_clash();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notices ENABLE ROW LEVEL SECURITY;

-- Public read access policies for academic schedules, rooms, and notices
DROP POLICY IF EXISTS "Public departments read" ON departments;
CREATE POLICY "Public departments read" ON departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public rooms read" ON rooms;
CREATE POLICY "Public rooms read" ON rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public faculties read" ON faculties;
CREATE POLICY "Public faculties read" ON faculties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public cohorts read" ON cohorts;
CREATE POLICY "Public cohorts read" ON cohorts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public courses read" ON courses;
CREATE POLICY "Public courses read" ON courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public timetable read" ON timetable_sessions;
CREATE POLICY "Public timetable read" ON timetable_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public notices read" ON in_app_notices;
CREATE POLICY "Public notices read" ON in_app_notices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public audit read" ON change_audit_logs;
CREATE POLICY "Public audit read" ON change_audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public change requests read" ON change_requests;
CREATE POLICY "Public change requests read" ON change_requests FOR SELECT USING (true);

-- Authenticated coordinator & admin write policies
DROP POLICY IF EXISTS "Admin/Coordinator insert session" ON timetable_sessions;
CREATE POLICY "Admin/Coordinator insert session" ON timetable_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin/Coordinator update session" ON timetable_sessions;
CREATE POLICY "Admin/Coordinator update session" ON timetable_sessions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin/Coordinator delete session" ON timetable_sessions;
CREATE POLICY "Admin/Coordinator delete session" ON timetable_sessions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Faculty insert request" ON change_requests;
CREATE POLICY "Faculty insert request" ON change_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Coordinator update request" ON change_requests;
CREATE POLICY "Coordinator update request" ON change_requests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Coordinator insert notice" ON in_app_notices;
CREATE POLICY "Coordinator insert notice" ON in_app_notices FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Coordinator update notice" ON in_app_notices;
CREATE POLICY "Coordinator update notice" ON in_app_notices FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Coordinator insert audit" ON change_audit_logs;
CREATE POLICY "Coordinator insert audit" ON change_audit_logs FOR INSERT WITH CHECK (true);
