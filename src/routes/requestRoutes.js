const express = require('express');
const router = express.Router();
const db = require('../database/db');
const changeRequestService = require('../services/changeRequestService');
const { requireRole } = require('../middleware/auth');
const { validateChangeRequestPayload } = require('../middleware/requestValidator');

// GET /api/change-requests
router.get('/', async (req, res, next) => {
    try {
        const filters = {
            status: req.query.status,
            urgency: req.query.urgency
        };
        const requests = await db.getChangeRequests(filters);
        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/change-requests/:id
router.get('/:id', async (req, res, next) => {
    try {
        const request = await db.getChangeRequestById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }
        res.json({ success: true, data: request });
    } catch (err) {
        next(err);
    }
});

// POST /api/change-requests (Submit request - Faculty, Coordinator, Admin)
router.post('/', requireRole(['faculty', 'coordinator', 'admin']), validateChangeRequestPayload, async (req, res, next) => {
    try {
        const payload = {
            session_id: req.body.session_id,
            requested_by_name: req.body.requested_by_name || req.user.name,
            requested_by_role: req.user.role,
            target_room_id: req.body.target_room_id || null,
            urgency: req.body.urgency || 'TODAY',
            reason_category: req.body.reason_category || 'EQUIPMENT_FAILURE',
            reason_details: req.body.reason_details
        };

        const result = await changeRequestService.submitRequest(payload);

        res.status(201).json({
            success: true,
            message: 'Change request submitted successfully for coordinator review.',
            data: result.request,
            preflightClash: result.preflightClash
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/change-requests/:id/review (Approve / Reject - Coordinator or Admin)
router.post('/:id/review', requireRole(['coordinator', 'admin']), async (req, res, next) => {
    try {
        const { action, target_room_id, review_notes } = req.body;

        if (!action || !['APPROVE', 'REJECT'].includes(action.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_ACTION',
                message: 'Action must be either "APPROVE" or "REJECT".'
            });
        }

        const result = await changeRequestService.reviewRequest(req.params.id, {
            action: action.toUpperCase(),
            target_room_id,
            reviewer_name: req.user.name,
            reviewer_role: req.user.role,
            review_notes
        });

        res.json({
            success: true,
            message: `Request successfully ${result.status.toLowerCase()}.`,
            ...result
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/change-requests/quick-relocate (Coordinator immediate shift)
router.post('/quick-relocate', requireRole(['coordinator', 'admin']), async (req, res, next) => {
    try {
        const { session_id, target_room_id, reason } = req.body;

        const result = await changeRequestService.quickRelocate({
            session_id,
            target_room_id,
            reason,
            coordinator_name: req.user.name
        });

        res.json({
            success: true,
            message: 'Classroom relocated immediately and campus notices broadcast.',
            ...result
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
