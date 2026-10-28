const express = require('express');
const router = express.Router();
const csvService = require('../services/csvService');
const { requireRole } = require('../middleware/auth');

// GET /api/csv/export (Download CSV)
router.get('/export', async (req, res, next) => {
    try {
        const filters = {
            day_of_week: req.query.day,
            cohort_id: req.query.cohort_id,
            faculty_id: req.query.faculty_id,
            room_id: req.query.room_id
        };

        const csvContent = await csvService.exportSessionsToCSV(filters);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="timetable_export.csv"');
        res.send(csvContent);
    } catch (err) {
        next(err);
    }
});

// GET /api/csv/template (Download sample template)
router.get('/template', (req, res) => {
    const template = csvService.getSampleCSVTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="timetable_template.csv"');
    res.send(template);
});

// POST /api/csv/import (Import CSV timetable)
router.post('/import', requireRole(['coordinator', 'admin']), express.text({ type: ['text/csv', 'text/plain'], limit: '5mb' }), async (req, res, next) => {
    try {
        let csvData = req.body;
        // In case express parsed as JSON with property "csv"
        if (typeof csvData !== 'string' && req.body && req.body.csv) {
            csvData = req.body.csv;
        }

        if (!csvData || typeof csvData !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'MISSING_CSV_BODY',
                message: 'Request body must contain CSV text or { "csv": "..." }'
            });
        }

        const dryRun = req.query.dryRun === 'true';
        const result = await csvService.importSessionsFromCSV(csvData, dryRun);

        res.json({
            success: true,
            message: dryRun
                ? `Pre-flight validation complete: ${result.importedCount} valid rows, ${result.failedCount} conflicting/invalid rows.`
                : `Successfully imported ${result.importedCount} sessions. (${result.failedCount} rows skipped due to clashes or format errors).`,
            ...result
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
