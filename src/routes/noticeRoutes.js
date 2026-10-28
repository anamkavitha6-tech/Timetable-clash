const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireRole } = require('../middleware/auth');

// GET /api/notices (Public)
router.get('/', async (req, res, next) => {
    try {
        const notices = await db.getNotices({ is_active: true });
        res.json({
            success: true,
            count: notices.length,
            data: notices
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/notices (Broadcast announcement - Coordinator/Admin)
router.post('/', requireRole(['coordinator', 'admin']), async (req, res, next) => {
    try {
        const { title, message, urgency, session_id, cohort_id, room_id, is_pinned } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_FAILED',
                message: 'Both title and message are required.'
            });
        }

        const notice = await db.createNotice({
            title,
            message,
            urgency: urgency || 'INFO',
            session_id: session_id || null,
            cohort_id: cohort_id || null,
            room_id: room_id || null,
            is_pinned: is_pinned !== undefined ? is_pinned : true
        });

        res.status(201).json({
            success: true,
            message: 'Notice broadcast to campus ticker and board.',
            data: notice
        });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/notices/:id/dismiss
router.patch('/:id/dismiss', requireRole(['coordinator', 'admin']), async (req, res, next) => {
    try {
        const dismissed = await db.dismissNotice(req.params.id);
        res.json({
            success: true,
            message: 'Notice dismissed.',
            data: dismissed
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
