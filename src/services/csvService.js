const db = require('../database/db');
const clashDetector = require('./clashDetector');

function escapeCSV(field) {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
}

function parseCSVLine(line) {
    const values = [];
    let curVal = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (insideQuotes && line[i + 1] === '"') {
                curVal += '"';
                i++; // skip next quote
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            values.push(curVal.trim());
            curVal = '';
        } else {
            curVal += char;
        }
    }
    values.push(curVal.trim());
    return values;
}

const csvService = {
    /**
     * Export timetable sessions to standard CSV string.
     */
    async exportSessionsToCSV(filters = {}) {
        const sessions = await db.getSessions(filters);

        const headers = [
            'Day',
            'StartTime',
            'EndTime',
            'CourseCode',
            'CourseName',
            'FacultyName',
            'CohortCode',
            'RoomNumber',
            'Building',
            'SessionType',
            'Status',
            'Notes'
        ];

        const rows = [headers.join(',')];

        for (const s of sessions) {
            const row = [
                escapeCSV(s.day_of_week),
                escapeCSV(s.start_time),
                escapeCSV(s.end_time),
                escapeCSV(s.course ? s.course.course_code : ''),
                escapeCSV(s.course ? s.course.course_name : ''),
                escapeCSV(s.faculty ? s.faculty.full_name : ''),
                escapeCSV(s.cohort ? s.cohort.code : ''),
                escapeCSV(s.room ? s.room.room_number : ''),
                escapeCSV(s.room ? s.room.building : ''),
                escapeCSV(s.session_type),
                escapeCSV(s.status),
                escapeCSV(s.notes || '')
            ];
            rows.push(row.join(','));
        }

        return rows.join('\r\n');
    },

    /**
     * Provide a sample CSV template for coordinators to download.
     */
    getSampleCSVTemplate() {
        return [
            'Day,StartTime,EndTime,CourseCode,CourseName,FacultyName,CohortCode,RoomNumber,Building,SessionType,Status,Notes',
            '"Monday","14:00","15:00","CS-301","Design & Analysis of Algorithms","Dr. Alan Sterling","CSE-2024-A","LH-101 (Turing Hall)","Engineering Complex East","Lecture","ACTIVE","Dynamic Programming Tutorial"',
            '"Wednesday","14:00","16:00","CS-302","Database Management Systems","Prof. Elena Vance","CSE-2024-B","LAB-201 (Shannon Computing Lab)","Turing Tech Tower","Lab","ACTIVE","SQL Indexing Practical"',
            '"Thursday","11:30","12:30","AI-301","Machine Learning & Neural Nets","Dr. Sarah Chen","AIDS-2024-A","CR-202 (Lovelace Smart Classroom)","Turing Tech Tower","Lecture","ACTIVE","Gradient Descent Deep Dive"'
        ].join('\r\n');
    },

    /**
     * Parse and validate CSV data, run clash detection per row, and import valid rows.
     */
    async importSessionsFromCSV(csvText, dryRun = false) {
        if (!csvText || typeof csvText !== 'string') {
            throw new Error('CSV text is empty or invalid.');
        }

        const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
            throw new Error('CSV contains no data rows. Header and at least one data row required.');
        }

        const headerLine = lines[0].toLowerCase();
        if (!headerLine.includes('day') || !headerLine.includes('start') || !headerLine.includes('course')) {
            throw new Error('CSV header missing mandatory columns: Day, StartTime, EndTime, CourseCode, RoomNumber.');
        }

        // Fetch lookup dictionaries
        const [rooms, faculties, cohorts, courses] = await Promise.all([
            db.getRooms(),
            db.getFaculties(),
            db.getCohorts(),
            db.getCourses()
        ]);

        const successfulImports = [];
        const failedRows = [];

        // Parse line by line
        for (let i = 1; i < lines.length; i++) {
            const rawLine = lines[i];
            const cols = parseCSVLine(rawLine);

            const day_of_week = cols[0];
            const start_time = cols[1];
            const end_time = cols[2];
            const courseCode = cols[3];
            const courseName = cols[4];
            const facultyName = cols[5];
            const cohortCode = cols[6];
            const roomNumber = cols[7];
            const session_type = cols[9] || 'Lecture';
            const notes = cols[11] || '';

            // Validation checks
            const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            if (!validDays.includes(day_of_week)) {
                failedRows.push({ row: i + 1, data: rawLine, error: `Invalid day "${day_of_week}". Must be one of: ${validDays.join(', ')}` });
                continue;
            }

            if (!start_time || !end_time || start_time >= end_time) {
                failedRows.push({ row: i + 1, data: rawLine, error: `Invalid time range "${start_time} - ${end_time}".` });
                continue;
            }

            // Resolve Foreign Keys
            const course = courses.find(c => c.course_code.toLowerCase() === (courseCode || '').toLowerCase() || c.course_name.toLowerCase() === (courseName || '').toLowerCase());
            const faculty = faculties.find(f => f.full_name.toLowerCase().includes((facultyName || '').toLowerCase()));
            const cohort = cohorts.find(ch => ch.code.toLowerCase() === (cohortCode || '').toLowerCase());
            const room = rooms.find(r => r.room_number.toLowerCase().includes((roomNumber || '').toLowerCase()));

            if (!course) {
                failedRows.push({ row: i + 1, data: rawLine, error: `Course "${courseCode || courseName}" not recognized in system.` });
                continue;
            }
            if (!faculty) {
                failedRows.push({ row: i + 1, data: rawLine, error: `Faculty member "${facultyName}" not recognized in system.` });
                continue;
            }
            if (!cohort) {
                failedRows.push({ row: i + 1, data: rawLine, error: `Cohort "${cohortCode}" not recognized in system.` });
                continue;
            }
            if (!room) {
                failedRows.push({ row: i + 1, data: rawLine, error: `Room "${roomNumber}" not recognized in system.` });
                continue;
            }

            // Conflict Detection Check!
            const proposed = {
                course_id: course.id,
                faculty_id: faculty.id,
                cohort_id: cohort.id,
                room_id: room.id,
                day_of_week,
                start_time,
                end_time,
                session_type,
                notes
            };

            const clashResult = await clashDetector.detectConflicts(proposed);

            if (clashResult.hasClash) {
                const reasons = clashResult.conflicts.map(c => c.message).join('; ');
                failedRows.push({ row: i + 1, data: rawLine, error: `Clash detected: ${reasons}` });
                continue;
            }

            // If dry run, just record as valid
            if (!dryRun) {
                const created = await db.createSession(proposed);
                successfulImports.push(created);
            } else {
                successfulImports.push(proposed);
            }
        }

        if (!dryRun && successfulImports.length > 0) {
            await db.createAuditLog({
                action_type: 'CSV_IMPORT_COMPLETED',
                details: `Imported ${successfulImports.length} timetable sessions from CSV. (${failedRows.length} rows failed).`,
                performed_by_role: 'Academic Coordinator',
                performed_by_name: 'CSV Bulk Processor'
            });
        }

        return {
            totalRows: lines.length - 1,
            importedCount: successfulImports.length,
            failedCount: failedRows.length,
            successfulImports,
            failedRows,
            dryRun
        };
    }
};

module.exports = csvService;
