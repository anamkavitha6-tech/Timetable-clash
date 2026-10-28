// Baseline Synthetic Seed Data for Timetable Clash & Classroom Change Coordinator (Hex UUIDs)

function getInitialData() {
    const departments = [
        {
            id: 'd1111111-1111-1111-1111-111111111111',
            code: 'CSE',
            name: 'Computer Science & Engineering',
            building: 'Engineering Complex East',
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'd2222222-2222-2222-2222-222222222222',
            code: 'AIDS',
            name: 'Artificial Intelligence & Data Science',
            building: 'Turing Tech Tower',
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        }
    ];

    const rooms = [
        {
            id: 'b1010000-0000-0000-0000-000000000101',
            room_number: 'LH-101 (Turing Hall)',
            building: 'Engineering Complex East',
            floor: 1,
            capacity: 80,
            room_type: 'Lecture Hall',
            has_projector: true,
            has_audio: true,
            has_ac: true,
            is_active: true,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'b1020000-0000-0000-0000-000000000102',
            room_number: 'AUD-102 (Hopper Auditorium)',
            building: 'Engineering Complex East',
            floor: 1,
            capacity: 120,
            room_type: 'Lecture Hall',
            has_projector: true,
            has_audio: true,
            has_ac: true,
            is_active: true,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'b2010000-0000-0000-0000-000000000201',
            room_number: 'LAB-201 (Shannon Computing Lab)',
            building: 'Turing Tech Tower',
            floor: 2,
            capacity: 45,
            room_type: 'Computer Lab',
            has_projector: true,
            has_audio: true,
            has_ac: true,
            is_active: true,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'b2020000-0000-0000-0000-000000000202',
            room_number: 'CR-202 (Lovelace Smart Classroom)',
            building: 'Turing Tech Tower',
            floor: 2,
            capacity: 65,
            room_type: 'Smart Classroom',
            has_projector: true,
            has_audio: true,
            has_ac: true,
            is_active: true,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'b3010000-0000-0000-0000-000000000301',
            room_number: 'SR-301 (Von Neumann Seminar Hall)',
            building: 'Engineering Complex East',
            floor: 3,
            capacity: 50,
            room_type: 'Seminar Room',
            has_projector: true,
            has_audio: true,
            has_ac: true,
            is_active: true,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'b3020000-0000-0000-0000-000000000302',
            room_number: 'CR-302 (Knuth Workshop Room)',
            building: 'Engineering Complex East',
            floor: 3,
            capacity: 40,
            room_type: 'Workshop',
            has_projector: true,
            has_audio: false,
            has_ac: true,
            is_active: true,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'b3030000-0000-0000-0000-000000000303',
            room_number: 'LAB-303 (Dijkstra Theory Lab)',
            building: 'Turing Tech Tower',
            floor: 3,
            capacity: 40,
            room_type: 'Computer Lab',
            has_projector: true,
            has_audio: true,
            has_ac: true,
            is_active: true,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'b4010000-0000-0000-0000-000000000401',
            room_number: 'LH-401 (Berners-Lee Studio)',
            building: 'Engineering Complex East',
            floor: 4,
            capacity: 75,
            room_type: 'Lecture Hall',
            has_projector: true,
            has_audio: true,
            has_ac: true,
            is_active: true,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        }
    ];

    const faculties = [
        {
            id: 'f1000000-0000-0000-0000-000000000001',
            full_name: 'Dr. Alan Sterling',
            email: 'alan.sterling@university.edu',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            designation: 'Professor & Head',
            office_room: 'ECE-301',
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'f2000000-0000-0000-0000-000000000002',
            full_name: 'Prof. Elena Vance',
            email: 'elena.vance@university.edu',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            designation: 'Associate Professor',
            office_room: 'ECE-304',
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'f3000000-0000-0000-0000-000000000003',
            full_name: 'Dr. Marcus Brody',
            email: 'marcus.brody@university.edu',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            designation: 'Associate Professor',
            office_room: 'TT-205',
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'f4000000-0000-0000-0000-000000000004',
            full_name: 'Dr. Sarah Chen',
            email: 'sarah.chen@university.edu',
            department_id: 'd2222222-2222-2222-2222-222222222222',
            designation: 'Assistant Professor',
            office_room: 'TT-210',
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'f5000000-0000-0000-0000-000000000005',
            full_name: 'Prof. David Miller',
            email: 'david.miller@university.edu',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            designation: 'Assistant Professor',
            office_room: 'ECE-112',
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'f6000000-0000-0000-0000-000000000006',
            full_name: 'Dr. Rachel Torres',
            email: 'rachel.torres@university.edu',
            department_id: 'd2222222-2222-2222-2222-222222222222',
            designation: 'Professor',
            office_room: 'TT-402',
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        }
    ];

    const cohorts = [
        {
            id: 'c1000000-0000-0000-0000-000000000001',
            code: 'CSE-2024-A',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            year: 3,
            semester: 5,
            student_count: 65,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'c2000000-0000-0000-0000-000000000002',
            code: 'CSE-2024-B',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            year: 3,
            semester: 5,
            student_count: 60,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'c3000000-0000-0000-0000-000000000003',
            code: 'CSE-2025-A',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            year: 2,
            semester: 3,
            student_count: 70,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'c4000000-0000-0000-0000-000000000004',
            code: 'AIDS-2024-A',
            department_id: 'd2222222-2222-2222-2222-222222222222',
            year: 3,
            semester: 5,
            student_count: 55,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        }
    ];

    const courses = [
        {
            id: 'e1000000-0000-0000-0000-000000000001',
            course_code: 'CS-301',
            course_name: 'Design & Analysis of Algorithms',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            credits: 4,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'e2000000-0000-0000-0000-000000000002',
            course_code: 'CS-302',
            course_name: 'Database Management Systems',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            credits: 4,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'e3000000-0000-0000-0000-000000000003',
            course_code: 'CS-303',
            course_name: 'Operating Systems & Architecture',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            credits: 4,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'e4000000-0000-0000-0000-000000000004',
            course_code: 'CS-304',
            course_name: 'Computer Networks & Protocols',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            credits: 3,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'e5000000-0000-0000-0000-000000000005',
            course_code: 'AI-301',
            course_name: 'Machine Learning & Neural Nets',
            department_id: 'd2222222-2222-2222-2222-222222222222',
            credits: 4,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        },
        {
            id: 'e6000000-0000-0000-0000-000000000006',
            course_code: 'CS-201',
            course_name: 'Data Structures & Algorithms',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            credits: 4,
            created_at: new Date('2026-01-10T08:00:00Z').toISOString()
        }
    ];

    const timetableSessions = [
        // Monday
        {
            id: 'a1000000-0000-0000-0000-000000000001',
            course_id: 'e1000000-0000-0000-0000-000000000001',
            faculty_id: 'f1000000-0000-0000-0000-000000000001',
            cohort_id: 'c1000000-0000-0000-0000-000000000001',
            room_id: 'b1010000-0000-0000-0000-000000000101',
            day_of_week: 'Monday',
            start_time: '09:00',
            end_time: '10:00',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'Algorithms Unit 3: Dynamic Programming',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date('2026-01-12T08:00:00Z').toISOString()
        },
        {
            id: 'a1000000-0000-0000-0000-000000000002',
            course_id: 'e2000000-0000-0000-0000-000000000002',
            faculty_id: 'f2000000-0000-0000-0000-000000000002',
            cohort_id: 'c2000000-0000-0000-0000-000000000002',
            room_id: 'b2020000-0000-0000-0000-000000000202',
            day_of_week: 'Monday',
            start_time: '09:00',
            end_time: '10:00',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'DBMS: B+ Tree Indexing',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date('2026-01-12T08:00:00Z').toISOString()
        },
        {
            id: 'a1000000-0000-0000-0000-000000000003',
            course_id: 'e5000000-0000-0000-0000-000000000005',
            faculty_id: 'f4000000-0000-0000-0000-000000000004',
            cohort_id: 'c4000000-0000-0000-0000-000000000004',
            room_id: 'b2010000-0000-0000-0000-000000000201',
            day_of_week: 'Monday',
            start_time: '09:00',
            end_time: '10:30',
            session_type: 'Lab',
            status: 'ACTIVE',
            notes: 'PyTorch CNN Lab Session',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date('2026-01-12T08:00:00Z').toISOString()
        },
        {
            id: 'a1000000-0000-0000-0000-000000000004',
            course_id: 'e3000000-0000-0000-0000-000000000003',
            faculty_id: 'f3000000-0000-0000-0000-000000000003',
            cohort_id: 'c1000000-0000-0000-0000-000000000001',
            room_id: 'b1010000-0000-0000-0000-000000000101',
            day_of_week: 'Monday',
            start_time: '10:15',
            end_time: '11:15',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'OS Virtual Memory & Paging',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date('2026-01-12T08:00:00Z').toISOString()
        },
        {
            id: 'a1000000-0000-0000-0000-000000000005',
            course_id: 'e4000000-0000-0000-0000-000000000004',
            faculty_id: 'f5000000-0000-0000-0000-000000000005',
            cohort_id: 'c2000000-0000-0000-0000-000000000002',
            room_id: 'b2020000-0000-0000-0000-000000000202',
            day_of_week: 'Monday',
            start_time: '10:15',
            end_time: '11:15',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'TCP Flow Control & Congestion',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date('2026-01-12T08:00:00Z').toISOString()
        },
        {
            id: 'a1000000-0000-0000-0000-000000000006',
            course_id: 'e6000000-0000-0000-0000-000000000006',
            faculty_id: 'f1000000-0000-0000-0000-000000000001',
            cohort_id: 'c3000000-0000-0000-0000-000000000003',
            room_id: 'b1020000-0000-0000-0000-000000000102',
            day_of_week: 'Monday',
            start_time: '11:30',
            end_time: '12:30',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'Data Structures: AVL Trees',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date('2026-01-12T08:00:00Z').toISOString()
        },

        // Tuesday
        {
            id: 'a2000000-0000-0000-0000-000000000001',
            course_id: 'e2000000-0000-0000-0000-000000000002',
            faculty_id: 'f2000000-0000-0000-0000-000000000002',
            cohort_id: 'c1000000-0000-0000-0000-000000000001',
            room_id: 'b1010000-0000-0000-0000-000000000101',
            day_of_week: 'Tuesday',
            start_time: '09:00',
            end_time: '10:00',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'Database Concurrency Control',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date('2026-01-12T08:00:00Z').toISOString()
        },
        {
            id: 'a2000000-0000-0000-0000-000000000002',
            course_id: 'e1000000-0000-0000-0000-000000000001',
            faculty_id: 'f1000000-0000-0000-0000-000000000001',
            cohort_id: 'c2000000-0000-0000-0000-000000000002',
            room_id: 'b2020000-0000-0000-0000-000000000202',
            day_of_week: 'Tuesday',
            start_time: '09:00',
            end_time: '10:00',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'Graph Algorithms & Shortest Path',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date('2026-01-12T08:00:00Z').toISOString()
        },
        {
            id: 'a2000000-0000-0000-0000-000000000003',
            course_id: 'e4000000-0000-0000-0000-000000000004',
            faculty_id: 'f5000000-0000-0000-0000-000000000005',
            cohort_id: 'c1000000-0000-0000-0000-000000000001',
            room_id: 'b1010000-0000-0000-0000-000000000101',
            day_of_week: 'Tuesday',
            start_time: '10:15',
            end_time: '11:15',
            session_type: 'Lecture',
            status: 'RELOCATED',
            notes: 'Shifted from Room 301 due to projector failure',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'a2000000-0000-0000-0000-000000000004',
            course_id: 'e5000000-0000-0000-0000-000000000005',
            faculty_id: 'f6000000-0000-0000-0000-000000000006',
            cohort_id: 'c4000000-0000-0000-0000-000000000004',
            room_id: 'b4010000-0000-0000-0000-000000000401',
            day_of_week: 'Tuesday',
            start_time: '10:15',
            end_time: '11:15',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'Deep Learning Architectures',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'a2000000-0000-0000-0000-000000000005',
            course_id: 'e3000000-0000-0000-0000-000000000003',
            faculty_id: 'f3000000-0000-0000-0000-000000000003',
            cohort_id: 'c2000000-0000-0000-0000-000000000002',
            room_id: 'b3030000-0000-0000-0000-000000000303',
            day_of_week: 'Tuesday',
            start_time: '13:30',
            end_time: '15:30',
            session_type: 'Lab',
            status: 'ACTIVE',
            notes: 'Kernel Programming Lab (Part A)',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date().toISOString()
        },

        // Wednesday
        {
            id: 'a3000000-0000-0000-0000-000000000001',
            course_id: 'e1000000-0000-0000-0000-000000000001',
            faculty_id: 'f1000000-0000-0000-0000-000000000001',
            cohort_id: 'c1000000-0000-0000-0000-000000000001',
            room_id: 'b1010000-0000-0000-0000-000000000101',
            day_of_week: 'Wednesday',
            start_time: '09:00',
            end_time: '10:00',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'Complexity Theory P vs NP',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'a3000000-0000-0000-0000-000000000002',
            course_id: 'e2000000-0000-0000-0000-000000000002',
            faculty_id: 'f2000000-0000-0000-0000-000000000002',
            cohort_id: 'c2000000-0000-0000-0000-000000000002',
            room_id: 'b2020000-0000-0000-0000-000000000202',
            day_of_week: 'Wednesday',
            start_time: '10:15',
            end_time: '11:15',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'SQL Query Optimization',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'a3000000-0000-0000-0000-000000000003',
            course_id: 'e5000000-0000-0000-0000-000000000005',
            faculty_id: 'f4000000-0000-0000-0000-000000000004',
            cohort_id: 'c4000000-0000-0000-0000-000000000004',
            room_id: 'b2010000-0000-0000-0000-000000000201',
            day_of_week: 'Wednesday',
            start_time: '11:30',
            end_time: '13:00',
            session_type: 'Lab',
            status: 'ACTIVE',
            notes: 'Model Evaluation & Metrics',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date().toISOString()
        },

        // Thursday
        {
            id: 'a4000000-0000-0000-0000-000000000001',
            course_id: 'e3000000-0000-0000-0000-000000000003',
            faculty_id: 'f3000000-0000-0000-0000-000000000003',
            cohort_id: 'c1000000-0000-0000-0000-000000000001',
            room_id: 'b1010000-0000-0000-0000-000000000101',
            day_of_week: 'Thursday',
            start_time: '09:00',
            end_time: '10:00',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'File Systems and I/O Operations',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'a4000000-0000-0000-0000-000000000002',
            course_id: 'e4000000-0000-0000-0000-000000000004',
            faculty_id: 'f5000000-0000-0000-0000-000000000005',
            cohort_id: 'c2000000-0000-0000-0000-000000000002',
            room_id: 'b2020000-0000-0000-0000-000000000202',
            day_of_week: 'Thursday',
            start_time: '10:15',
            end_time: '11:15',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'DNS and Application Layer Protocols',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date().toISOString()
        },

        // Friday
        {
            id: 'a5000000-0000-0000-0000-000000000001',
            course_id: 'e6000000-0000-0000-0000-000000000006',
            faculty_id: 'f1000000-0000-0000-0000-000000000001',
            cohort_id: 'c3000000-0000-0000-0000-000000000003',
            room_id: 'b1020000-0000-0000-0000-000000000102',
            day_of_week: 'Friday',
            start_time: '09:00',
            end_time: '10:00',
            session_type: 'Lecture',
            status: 'ACTIVE',
            notes: 'Sorting & Searching Benchmarks',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'a5000000-0000-0000-0000-000000000002',
            course_id: 'e5000000-0000-0000-0000-000000000005',
            faculty_id: 'f6000000-0000-0000-0000-000000000006',
            cohort_id: 'c4000000-0000-0000-0000-000000000004',
            room_id: 'b4010000-0000-0000-0000-000000000401',
            day_of_week: 'Friday',
            start_time: '11:30',
            end_time: '12:30',
            session_type: 'Seminar',
            status: 'ACTIVE',
            notes: 'AI Ethics and Frontier Governance',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    const changeRequests = [
        {
            id: 'b1000000-0000-0000-0000-000000000001',
            session_id: 'a2000000-0000-0000-0000-000000000003',
            requested_by_name: 'Prof. David Miller',
            requested_by_role: 'Faculty',
            original_room_id: 'b3010000-0000-0000-0000-000000000301',
            target_room_id: 'b1010000-0000-0000-0000-000000000101',
            urgency: 'IMMEDIATE',
            reason_category: 'EQUIPMENT_FAILURE',
            reason_details: 'Ceiling projector HDMI port damaged; lecture requires live Wireshark packet capture demo.',
            status: 'APPROVED',
            reviewed_by: 'Academic Coordinator',
            review_notes: 'Verified Turing Hall LH-101 was free at Tuesday 10:15. Approved and moved immediately.',
            reviewed_at: new Date(Date.now() - 7200000).toISOString(),
            created_at: new Date(Date.now() - 10800000).toISOString(),
            updated_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: 'b2000000-0000-0000-0000-000000000002',
            session_id: 'a1000000-0000-0000-0000-000000000003',
            requested_by_name: 'Dr. Sarah Chen',
            requested_by_role: 'Faculty',
            original_room_id: 'b2010000-0000-0000-0000-000000000201',
            target_room_id: 'b3030000-0000-0000-0000-000000000303',
            urgency: 'IMMEDIATE',
            reason_category: 'MAINTENANCE',
            reason_details: 'AC cooling unit leaking water onto back benches. Urgent relocation required for 55 students.',
            status: 'PENDING_REVIEW',
            reviewed_by: null,
            review_notes: null,
            reviewed_at: null,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 'b3000000-0000-0000-0000-000000000003',
            session_id: 'a3000000-0000-0000-0000-000000000002',
            requested_by_name: 'Prof. Elena Vance',
            requested_by_role: 'Faculty',
            original_room_id: 'b2020000-0000-0000-0000-000000000202',
            target_room_id: 'b1020000-0000-0000-0000-000000000102',
            urgency: 'TODAY',
            reason_category: 'OVERFLOW',
            reason_details: 'Combined cohort revision lecture with Section B; requires 100+ seating capacity.',
            status: 'PENDING_REVIEW',
            reviewed_by: null,
            review_notes: null,
            reviewed_at: null,
            created_at: new Date(Date.now() - 1800000).toISOString(),
            updated_at: new Date(Date.now() - 1800000).toISOString()
        }
    ];

    const changeAuditLogs = [
        {
            id: 'a1000000-0000-0000-0000-000000000001',
            session_id: 'a2000000-0000-0000-0000-000000000003',
            change_request_id: 'b1000000-0000-0000-0000-000000000001',
            action_type: 'ROOM_RELOCATED',
            details: 'Approved last-minute relocation from SR-301 to LH-101 (Turing Hall) due to projector breakdown.',
            previous_state: { room_id: 'b3010000-0000-0000-0000-000000000301', room_name: 'SR-301 (Von Neumann Seminar Hall)' },
            new_state: { room_id: 'b1010000-0000-0000-0000-000000000101', room_name: 'LH-101 (Turing Hall)' },
            performed_by_role: 'Academic Coordinator',
            performed_by_name: 'Dr. Patricia Ward',
            created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: 'a2000000-0000-0000-0000-000000000002',
            session_id: 'a1000000-0000-0000-0000-000000000001',
            change_request_id: null,
            action_type: 'SESSION_CREATED',
            details: 'Initial baseline timetable generation for Semester 5 Algorithms lecture.',
            previous_state: null,
            new_state: { course: 'CS-301', cohort: 'CSE-2024-A', room: 'LH-101' },
            performed_by_role: 'Administrator',
            performed_by_name: 'System Admin',
            created_at: new Date('2026-01-12T08:00:00Z').toISOString()
        }
    ];

    const inAppNotices = [
        {
            id: 'c1000000-0000-0000-0000-000000000001',
            title: 'URGENT: CS-304 Relocated to LH-101 (Turing Hall)',
            message: 'Prof. David Miller’s Computer Networks class on Tuesday 10:15 AM is moved from SR-301 to LH-101 (Turing Hall) due to AV equipment maintenance.',
            urgency: 'CRITICAL',
            session_id: 'a2000000-0000-0000-0000-000000000003',
            cohort_id: 'c1000000-0000-0000-0000-000000000001',
            room_id: 'b1010000-0000-0000-0000-000000000101',
            is_pinned: true,
            is_active: true,
            created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: 'c2000000-0000-0000-0000-000000000002',
            title: 'NOTICE: Shannon Lab AC Servicing Underway',
            message: 'Technicians are addressing HVAC cooling issues in LAB-201. Please report any further temperature anomalies to the Coordinator desk.',
            urgency: 'WARNING',
            session_id: null,
            cohort_id: null,
            room_id: 'b2010000-0000-0000-0000-000000000201',
            is_pinned: true,
            is_active: true,
            created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 'c3000000-0000-0000-0000-000000000003',
            title: 'INFO: Week 8 Timetable Adjustments Finalized',
            message: 'Midterm review slots have been allocated. Please review the updated Friday schedule on the interactive timetable grid.',
            urgency: 'INFO',
            session_id: null,
            cohort_id: null,
            room_id: null,
            is_pinned: false,
            is_active: true,
            created_at: new Date(Date.now() - 1800000).toISOString()
        }
    ];

    return {
        departments,
        rooms,
        faculties,
        cohorts,
        courses,
        timetableSessions,
        changeRequests,
        changeAuditLogs,
        inAppNotices
    };
}

module.exports = {
    getInitialData
};
