const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { getStatus } = require('../config/supabase');
const clashDetector = require('../services/clashDetector');
const { requireRole } = require('../middleware/auth');

// GET /api/system/metrics
router.get('/metrics', async (req, res, next) => {
    try {
        const metrics = await db.getSystemMetrics();
        const clashAudit = await clashDetector.auditFullTimetable();
        metrics.activeClashesCount = clashAudit.totalClashes;

        res.json({
            success: true,
            data: metrics
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/system/status
router.get('/status', (req, res) => {
    const status = getStatus();
    res.json({
        success: true,
        status: 'ONLINE',
        mode: status.configured ? 'SUPABASE_POSTGRESQL' : 'RESILIENT_DEMO_STORE',
        database: status
    });
});

// POST /api/system/reset-demo (Admin only)
router.post('/reset-demo', requireRole(['admin']), async (req, res, next) => {
    try {
        const result = await db.resetDemoData();
        res.json({
            success: true,
            message: 'All timetable, room requests, and audit data successfully reset to baseline synthetic demonstration state.',
            result
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
