const express = require('express');
const router = express.Router();
const db = require('../database/db');
const clashDetector = require('../services/clashDetector');
const { requireRole } = require('../middleware/auth');
const { validateSessionPayload } = require('../middleware/requestValidator');

// GET /api/timetable
router.get('/', async (req, res, next) => {
    try {
        const filters = {
            day_of_week: req.query.day,
            cohort_id: req.query.cohort_id,
            faculty_id: req.query.faculty_id,
            room_id: req.query.room_id,
            status: req.query.status,
            search: req.query.search
        };

        const sessions = await db.getSessions(filters);
        res.json({
            success: true,
            count: sessions.length,
            filters,
            data: sessions
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/timetable/:id
router.get('/:id', async (req, res, next) => {
    try {
        const session = await db.getSessionById(req.params.id);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }
        res.json({ success: true, data: session });
    } catch (err) {
        next(err);
    }
});

// POST /api/timetable (Create new session)
router.post('/', requireRole(['coordinator', 'admin']), validateSessionPayload, async (req, res, next) => {
    try {
        const payload = req.body;

        // Perform conflict detection
        const clashResult = await clashDetector.detectConflicts(payload);

        if (clashResult.hasClash && !req.query.force) {
            return res.status(409).json({
                success: false,
                error: 'TIMETABLE_CLASH_DETECTED',
                message: 'One or more scheduling overlaps detected.',
                conflicts: clashResult.conflicts,
                warnings: clashResult.warnings
            });
        }

        const newSession = await db.createSession(payload);

        // Audit log
        await db.createAuditLog({
            session_id: newSession.id,
            action_type: 'SESSION_CREATED',
            details: `Created session ${newSession.course ? newSession.course.course_code : ''} on ${newSession.day_of_week} ${newSession.start_time}-${newSession.end_time}`,
            new_state: payload,
            performed_by_role: req.user.role,
            performed_by_name: req.user.name
        });

        res.status(201).json({
            success: true,
            data: newSession,
            warnings: clashResult.warnings
        });
    } catch (err) {
        next(err);
    }
});

// PUT /api/timetable/:id (Update session)
router.put('/:id', requireRole(['coordinator', 'admin']), async (req, res, next) => {
    try {
        const session = await db.getSessionById(req.params.id);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        const updatedData = {
            course_id: req.body.course_id || session.course_id,
            faculty_id: req.body.faculty_id || session.faculty_id,
            cohort_id: req.body.cohort_id || session.cohort_id,
            room_id: req.body.room_id || session.room_id,
            day_of_week: req.body.day_of_week || session.day_of_week,
            start_time: req.body.start_time || session.start_time,
            end_time: req.body.end_time || session.end_time,
            session_type: req.body.session_type || session.session_type,
            status: req.body.status || session.status,
            notes: req.body.notes !== undefined ? req.body.notes : session.notes
        };

        // Conflict check excluding current session
        const clashResult = await clashDetector.detectConflicts(updatedData, session.id);

        if (clashResult.hasClash && !req.query.force) {
            return res.status(409).json({
                success: false,
                error: 'TIMETABLE_CLASH_DETECTED',
                message: 'Schedule update causes a timetable clash.',
                conflicts: clashResult.conflicts,
                warnings: clashResult.warnings
            });
        }

        const updated = await db.updateSession(session.id, updatedData);

        // Audit log
        await db.createAuditLog({
            session_id: session.id,
            action_type: 'SESSION_UPDATED',
            details: `Updated session ${session.course ? session.course.course_code : ''}`,
            previous_state: { room_id: session.room_id, day: session.day_of_week, start: session.start_time, end: session.end_time },
            new_state: updatedData,
            performed_by_role: req.user.role,
            performed_by_name: req.user.name
        });

        res.json({
            success: true,
            data: updated,
            warnings: clashResult.warnings
        });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/timetable/:id
router.delete('/:id', requireRole(['coordinator', 'admin']), async (req, res, next) => {
    try {
        const session = await db.getSessionById(req.params.id);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        await db.deleteSession(req.params.id);

        await db.createAuditLog({
            session_id: req.params.id,
            action_type: 'SESSION_DELETED',
            details: `Deleted session ${session.course ? session.course.course_code : ''} on ${session.day_of_week}`,
            previous_state: session,
            performed_by_role: req.user.role,
            performed_by_name: req.user.name
        });

        res.json({
            success: true,
            message: 'Session removed successfully'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
