-- =========================================================================
-- TIMETABLE CLASH AND LAST-MINUTE CLASSROOM CHANGE COORDINATOR
-- Supabase PostgreSQL Seed Data (Strict Hexadecimal UUIDs)
-- =========================================================================

-- Clear existing data if needed
TRUNCATE TABLE in_app_notices, change_audit_logs, change_requests, timetable_sessions, courses, cohorts, faculties, rooms, departments CASCADE;

-- 1. DEPARTMENTS
INSERT INTO departments (id, code, name, building) VALUES
('d1111111-1111-1111-1111-111111111111', 'CSE', 'Computer Science & Engineering', 'Engineering Complex East'),
('d2222222-2222-2222-2222-222222222222', 'AIDS', 'Artificial Intelligence & Data Science', 'Turing Tech Tower');

-- 2. ROOMS
INSERT INTO rooms (id, room_number, building, floor, capacity, room_type, has_projector, has_audio, has_ac, is_active) VALUES
('b1010000-0000-0000-0000-000000000101', 'LH-101 (Turing Hall)', 'Engineering Complex East', 1, 80, 'Lecture Hall', true, true, true, true),
('b1020000-0000-0000-0000-000000000102', 'AUD-102 (Hopper Auditorium)', 'Engineering Complex East', 1, 120, 'Lecture Hall', true, true, true, true),
('b2010000-0000-0000-0000-000000000201', 'LAB-201 (Shannon Computing Lab)', 'Turing Tech Tower', 2, 45, 'Computer Lab', true, true, true, true),
('b2020000-0000-0000-0000-000000000202', 'CR-202 (Lovelace Smart Classroom)', 'Turing Tech Tower', 2, 65, 'Smart Classroom', true, true, true, true),
('b3010000-0000-0000-0000-000000000301', 'SR-301 (Von Neumann Seminar Hall)', 'Engineering Complex East', 3, 50, 'Seminar Room', true, true, true, true),
('b3020000-0000-0000-0000-000000000302', 'CR-302 (Knuth Workshop Room)', 'Engineering Complex East', 3, 40, 'Workshop', true, false, true, true),
('b3030000-0000-0000-0000-000000000303', 'LAB-303 (Dijkstra Theory Lab)', 'Turing Tech Tower', 3, 40, 'Computer Lab', true, true, true, true),
('b4010000-0000-0000-0000-000000000401', 'LH-401 (Berners-Lee Studio)', 'Engineering Complex East', 4, 75, 'Lecture Hall', true, true, true, true);

-- 3. FACULTIES
INSERT INTO faculties (id, full_name, email, department_id, designation, office_room) VALUES
('f1000000-0000-0000-0000-000000000001', 'Dr. Alan Sterling', 'alan.sterling@university.edu', 'd1111111-1111-1111-1111-111111111111', 'Professor & Head', 'ECE-301'),
('f2000000-0000-0000-0000-000000000002', 'Prof. Elena Vance', 'elena.vance@university.edu', 'd1111111-1111-1111-1111-111111111111', 'Associate Professor', 'ECE-304'),
('f3000000-0000-0000-0000-000000000003', 'Dr. Marcus Brody', 'marcus.brody@university.edu', 'd1111111-1111-1111-1111-111111111111', 'Associate Professor', 'TT-205'),
('f4000000-0000-0000-0000-000000000004', 'Dr. Sarah Chen', 'sarah.chen@university.edu', 'd2222222-2222-2222-2222-222222222222', 'Assistant Professor', 'TT-210'),
('f5000000-0000-0000-0000-000000000005', 'Prof. David Miller', 'david.miller@university.edu', 'd1111111-1111-1111-1111-111111111111', 'Assistant Professor', 'ECE-112'),
('f6000000-0000-0000-0000-000000000006', 'Dr. Rachel Torres', 'rachel.torres@university.edu', 'd2222222-2222-2222-2222-222222222222', 'Professor', 'TT-402');

-- 4. COHORTS
INSERT INTO cohorts (id, code, department_id, year, semester, student_count) VALUES
('c1000000-0000-0000-0000-000000000001', 'CSE-2024-A', 'd1111111-1111-1111-1111-111111111111', 3, 5, 65),
('c2000000-0000-0000-0000-000000000002', 'CSE-2024-B', 'd1111111-1111-1111-1111-111111111111', 3, 5, 60),
('c3000000-0000-0000-0000-000000000003', 'CSE-2025-A', 'd1111111-1111-1111-1111-111111111111', 2, 3, 70),
('c4000000-0000-0000-0000-000000000004', 'AIDS-2024-A', 'd2222222-2222-2222-2222-222222222222', 3, 5, 55);

-- 5. COURSES
INSERT INTO courses (id, course_code, course_name, department_id, credits) VALUES
('e1000000-0000-0000-0000-000000000001', 'CS-301', 'Design & Analysis of Algorithms', 'd1111111-1111-1111-1111-111111111111', 4),
('e2000000-0000-0000-0000-000000000002', 'CS-302', 'Database Management Systems', 'd1111111-1111-1111-1111-111111111111', 4),
('e3000000-0000-0000-0000-000000000003', 'CS-303', 'Operating Systems & Architecture', 'd1111111-1111-1111-1111-111111111111', 4),
('e4000000-0000-0000-0000-000000000004', 'CS-304', 'Computer Networks & Protocols', 'd1111111-1111-1111-1111-111111111111', 3),
('e5000000-0000-0000-0000-000000000005', 'AI-301', 'Machine Learning & Neural Nets', 'd2222222-2222-2222-2222-222222222222', 4),
('e6000000-0000-0000-0000-000000000006', 'CS-201', 'Data Structures & Algorithms', 'd1111111-1111-1111-1111-111111111111', 4);

-- 6. TIMETABLE SESSIONS
INSERT INTO timetable_sessions (id, course_id, faculty_id, cohort_id, room_id, day_of_week, start_time, end_time, session_type, status, notes) VALUES
-- Monday Sessions
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1010000-0000-0000-0000-000000000101', 'Monday', '09:00:00', '10:00:00', 'Lecture', 'ACTIVE', 'Algorithms Unit 3: Dynamic Programming'),
('a1000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000002', 'f2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'b2020000-0000-0000-0000-000000000202', 'Monday', '09:00:00', '10:00:00', 'Lecture', 'ACTIVE', 'DBMS: B+ Tree Indexing'),
('a1000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000005', 'f4000000-0000-0000-0000-000000000004', 'c4000000-0000-0000-0000-000000000004', 'b2010000-0000-0000-0000-000000000201', 'Monday', '09:00:00', '10:30:00', 'Lab', 'ACTIVE', 'PyTorch CNN Lab Session'),
('a1000000-0000-0000-0000-000000000004', 'e3000000-0000-0000-0000-000000000003', 'f3000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'b1010000-0000-0000-0000-000000000101', 'Monday', '10:15:00', '11:15:00', 'Lecture', 'ACTIVE', 'OS Virtual Memory & Paging'),
('a1000000-0000-0000-0000-000000000005', 'e4000000-0000-0000-0000-000000000004', 'f5000000-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000002', 'b2020000-0000-0000-0000-000000000202', 'Monday', '10:15:00', '11:15:00', 'Lecture', 'ACTIVE', 'TCP Flow Control & Congestion'),
('a1000000-0000-0000-0000-000000000006', 'e6000000-0000-0000-0000-000000000006', 'f1000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000003', 'b1020000-0000-0000-0000-000000000102', 'Monday', '11:30:00', '12:30:00', 'Lecture', 'ACTIVE', 'Data Structures: AVL Trees'),

-- Tuesday Sessions
('a2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000002', 'f2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'b1010000-0000-0000-0000-000000000101', 'Tuesday', '09:00:00', '10:00:00', 'Lecture', 'ACTIVE', 'Database Concurrency Control'),
('a2000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000002', 'b2020000-0000-0000-0000-000000000202', 'Tuesday', '09:00:00', '10:00:00', 'Lecture', 'ACTIVE', 'Graph Algorithms & Shortest Path'),
('a2000000-0000-0000-0000-000000000003', 'e4000000-0000-0000-0000-000000000004', 'f5000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'b1010000-0000-0000-0000-000000000101', 'Tuesday', '10:15:00', '11:15:00', 'Lecture', 'RELOCATED', 'Shifted from Room 301 due to projector failure'),
('a2000000-0000-0000-0000-000000000004', 'e5000000-0000-0000-0000-000000000005', 'f6000000-0000-0000-0000-000000000006', 'c4000000-0000-0000-0000-000000000004', 'b4010000-0000-0000-0000-000000000401', 'Tuesday', '10:15:00', '11:15:00', 'Lecture', 'ACTIVE', 'Deep Learning Architectures'),
('a2000000-0000-0000-0000-000000000005', 'e3000000-0000-0000-0000-000000000003', 'f3000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000002', 'b3030000-0000-0000-0000-000000000303', 'Tuesday', '13:30:00', '15:30:00', 'Lab', 'ACTIVE', 'Kernel Programming Lab (Part A)'),

-- Wednesday Sessions
('a3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1010000-0000-0000-0000-000000000101', 'Wednesday', '09:00:00', '10:00:00', 'Lecture', 'ACTIVE', 'Complexity Theory P vs NP'),
('a3000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000002', 'f2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'b2020000-0000-0000-0000-000000000202', 'Wednesday', '10:15:00', '11:15:00', 'Lecture', 'ACTIVE', 'SQL Query Optimization'),
('a3000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000005', 'f4000000-0000-0000-0000-000000000004', 'c4000000-0000-0000-0000-000000000004', 'b2010000-0000-0000-0000-000000000201', 'Wednesday', '11:30:00', '13:00:00', 'Lab', 'ACTIVE', 'Model Evaluation & Metrics'),

-- Thursday Sessions
('a4000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000003', 'f3000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'b1010000-0000-0000-0000-000000000101', 'Thursday', '09:00:00', '10:00:00', 'Lecture', 'ACTIVE', 'File Systems and I/O Operations'),
('a4000000-0000-0000-0000-000000000002', 'e4000000-0000-0000-0000-000000000004', 'f5000000-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000002', 'b2020000-0000-0000-0000-000000000202', 'Thursday', '10:15:00', '11:15:00', 'Lecture', 'ACTIVE', 'DNS and Application Layer Protocols'),

-- Friday Sessions
('a5000000-0000-0000-0000-000000000001', 'e6000000-0000-0000-0000-000000000006', 'f1000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000003', 'b1020000-0000-0000-0000-000000000102', 'Friday', '09:00:00', '10:00:00', 'Lecture', 'ACTIVE', 'Sorting & Searching Benchmarks'),
('a5000000-0000-0000-0000-000000000002', 'e5000000-0000-0000-0000-000000000005', 'f6000000-0000-0000-0000-000000000006', 'c4000000-0000-0000-0000-000000000004', 'b4010000-0000-0000-0000-000000000401', 'Friday', '11:30:00', '12:30:00', 'Seminar', 'ACTIVE', 'AI Ethics and Frontier Governance');

-- 7. CHANGE REQUESTS
INSERT INTO change_requests (id, session_id, requested_by_name, requested_by_role, original_room_id, target_room_id, urgency, reason_category, reason_details, status, reviewed_by, review_notes, reviewed_at) VALUES
('b1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000003', 'Prof. David Miller', 'Faculty', 'b3010000-0000-0000-0000-000000000301', 'b1010000-0000-0000-0000-000000000101', 'IMMEDIATE', 'EQUIPMENT_FAILURE', 'Ceiling projector HDMI port damaged; lecture requires live Wireshark packet capture demo.', 'APPROVED', 'Academic Coordinator', 'Verified Turing Hall LH-101 was free at Tuesday 10:15. Approved and moved immediately.', NOW() - INTERVAL '2 hours'),
('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'Dr. Sarah Chen', 'Faculty', 'b2010000-0000-0000-0000-000000000201', 'b3030000-0000-0000-0000-000000000303', 'IMMEDIATE', 'MAINTENANCE', 'AC cooling unit leaking water onto back benches. Urgent relocation required for 55 students.', 'PENDING_REVIEW', NULL, NULL, NULL),
('b3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000002', 'Prof. Elena Vance', 'Faculty', 'b2020000-0000-0000-0000-000000000202', 'b1020000-0000-0000-0000-000000000102', 'TODAY', 'OVERFLOW', 'Combined cohort revision lecture with Section B; requires 100+ seating capacity.', 'PENDING_REVIEW', NULL, NULL, NULL);

-- 8. CHANGE AUDIT LOGS
INSERT INTO change_audit_logs (id, session_id, change_request_id, action_type, details, previous_state, new_state, performed_by_role, performed_by_name) VALUES
('a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'ROOM_RELOCATED', 'Approved last-minute relocation from SR-301 to LH-101 (Turing Hall) due to projector breakdown.', '{"room_id": "b3010000-0000-0000-0000-000000000301", "room_name": "SR-301"}', '{"room_id": "b1010000-0000-0000-0000-0000000101", "room_name": "LH-101 (Turing Hall)"}', 'Academic Coordinator', 'Dr. Patricia Ward'),
('a2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', NULL, 'SESSION_CREATED', 'Initial baseline timetable generation for Semester 5 Algorithms lecture.', NULL, '{"course": "CS-301", "cohort": "CSE-2024-A", "room": "LH-101"}', 'Administrator', 'System Admin');

-- 9. IN-APP NOTICES & ALERTS
INSERT INTO in_app_notices (id, title, message, urgency, session_id, cohort_id, room_id, is_pinned, is_active) VALUES
('c1000000-0000-0000-0000-000000000001', 'URGENT: CS-304 Relocated to LH-101 (Turing Hall)', 'Prof. David Miller’s Computer Networks class on Tuesday 10:15 AM is moved from SR-301 to LH-101 (Turing Hall) due to AV equipment maintenance.', 'CRITICAL', 'a2000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'b1010000-0000-0000-0000-000000000101', true, true),
('c2000000-0000-0000-0000-000000000002', 'NOTICE: Shannon Lab AC Servicing Underway', 'Technicians are addressing HVAC cooling issues in LAB-201. Please report any further temperature anomalies to the Coordinator desk.', 'WARNING', NULL, NULL, 'b2010000-0000-0000-0000-000000000201', true, true),
('c3000000-0000-0000-0000-000000000003', 'INFO: Week 8 Timetable Adjustments Finalized', 'Midterm review slots have been allocated. Please review the updated Friday schedule on the interactive timetable grid.', 'INFO', NULL, NULL, NULL, false, true);
