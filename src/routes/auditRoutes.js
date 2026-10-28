const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/audit-logs
router.get('/', async (req, res, next) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const logs = await db.getAuditLogs(limit);
        res.json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
