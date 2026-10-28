const db = require('../database/db');

// Convert "HH:MM" or "HH:MM:SS" to minutes since midnight
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

// Check if two time intervals overlap (strictly start < other.end && end > other.start)
function intervalsOverlap(startA, endA, startB, endB) {
    const minStartA = timeToMinutes(startA);
    const minEndA = timeToMinutes(endA);
    const minStartB = timeToMinutes(startB);
    const minEndB = timeToMinutes(endB);

    return minStartA < minEndB && minEndA > minStartB;
}

const clashDetector = {
    timeToMinutes,
    intervalsOverlap,

    /**
     * Check if proposed session parameters cause a clash with existing active sessions.
     * @param {Object} proposed
     * @param {string} [excludeSessionId] - ID of the session being edited to exclude from self-collision
     */
    async detectConflicts(proposed, excludeSessionId = null) {
        const {
            room_id,
            faculty_id,
            cohort_id,
            day_of_week,
            start_time,
            end_time
        } = proposed;

        const conflicts = [];
        const warnings = [];

        // Basic time boundary check
        if (timeToMinutes(start_time) >= timeToMinutes(end_time)) {
            conflicts.push({
                type: 'INVALID_TIME',
                title: 'Invalid Time Range',
                message: `Start time (${start_time}) must be earlier than end time (${end_time}).`,
                severity: 'CRITICAL'
            });
            return {
                hasClash: true,
                conflicts,
                warnings
            };
        }

        // Fetch all active sessions on this day of week
        const allSessions = await db.getSessions({ day_of_week });
        const activeSessions = allSessions.filter(s =>
            s.id !== excludeSessionId &&
            s.status !== 'CANCELLED'
        );

        // Fetch Room & Cohort metadata for capacity warnings
        const [room, cohort, faculty] = await Promise.all([
            room_id ? db.getRoomById(room_id) : null,
            cohort_id ? (await db.getCohorts()).find(c => c.id === cohort_id) : null,
            faculty_id ? (await db.getFaculties()).find(f => f.id === faculty_id) : null
        ]);

        for (const existing of activeSessions) {
            const overlaps = intervalsOverlap(start_time, end_time, existing.start_time, existing.end_time);

            if (!overlaps) continue;

            const timeRange = `${existing.start_time} - ${existing.end_time}`;
            const courseName = existing.course ? existing.course.course_code + ' (' + existing.course.course_name + ')' : 'Another Class';

            // 1. Room Double-Booking Check
            if (room_id && existing.room_id === room_id) {
                conflicts.push({
                    type: 'ROOM',
                    title: 'Classroom Double-Booking Conflict',
                    message: `${room ? room.room_number : 'Selected room'} is already occupied by ${courseName} from ${timeRange}.`,
                    severity: 'HIGH',
                    conflictingSession: {
                        id: existing.id,
                        course: existing.course,
                        faculty: existing.faculty,
                        cohort: existing.cohort,
                        time: timeRange
                    }
                });
            }

            // 2. Faculty Schedule Overlap Check
            if (faculty_id && existing.faculty_id === faculty_id) {
                conflicts.push({
                    type: 'FACULTY',
                    title: 'Faculty Member Overbooked',
                    message: `${faculty ? faculty.full_name : 'Selected faculty member'} is already scheduled to teach ${courseName} from ${timeRange}.`,
                    severity: 'HIGH',
                    conflictingSession: {
                        id: existing.id,
                        course: existing.course,
                        cohort: existing.cohort,
                        room: existing.room,
                        time: timeRange
                    }
                });
            }

            // 3. Cohort Schedule Overlap Check
            if (cohort_id && existing.cohort_id === cohort_id) {
                conflicts.push({
                    type: 'COHORT',
                    title: 'Cohort Double-Booking Conflict',
                    message: `Cohort ${cohort ? cohort.code : 'Selected cohort'} already has ${courseName} scheduled from ${timeRange}.`,
                    severity: 'HIGH',
                    conflictingSession: {
                        id: existing.id,
                        course: existing.course,
                        faculty: existing.faculty,
                        room: existing.room,
                        time: timeRange
                    }
                });
            }
        }

        // Capacity Overflow Warning Check
        if (room && cohort) {
            if (cohort.student_count > room.capacity) {
                warnings.push({
                    type: 'CAPACITY_OVERFLOW',
                    title: 'Room Capacity Warning',
                    message: `Cohort "${cohort.code}" has ${cohort.student_count} students, exceeding ${room.room_number}'s maximum capacity of ${room.capacity} seats by ${cohort.student_count - room.capacity}.`,
                    severity: 'MODERATE'
                });
            }
        }

        return {
            hasClash: conflicts.length > 0,
            conflicts,
            warnings
        };
    },

    /**
     * Audit full timetable to identify any preexisting collisions.
     */
    async auditFullTimetable() {
        const allSessions = await db.getSessions();
        const active = allSessions.filter(s => s.status !== 'CANCELLED');
        const clashPairs = [];

        for (let i = 0; i < active.length; i++) {
            for (let j = i + 1; j < active.length; j++) {
                const s1 = active[i];
                const s2 = active[j];

                if (s1.day_of_week === s2.day_of_week && intervalsOverlap(s1.start_time, s1.end_time, s2.start_time, s2.end_time)) {
                    if (s1.room_id === s2.room_id) {
                        clashPairs.push({ type: 'ROOM', session1: s1, session2: s2 });
                    }
                    if (s1.faculty_id === s2.faculty_id) {
                        clashPairs.push({ type: 'FACULTY', session1: s1, session2: s2 });
                    }
                    if (s1.cohort_id === s2.cohort_id) {
                        clashPairs.push({ type: 'COHORT', session1: s1, session2: s2 });
                    }
                }
            }
        }

        return {
            totalClashes: clashPairs.length,
            clashes: clashPairs
        };
    }
};

module.exports = clashDetector;
