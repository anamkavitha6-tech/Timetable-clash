const express = require('express');
const router = express.Router();
const clashDetector = require('../services/clashDetector');
const roomFinder = require('../services/roomFinder');

// POST /api/clash-detect
// Pre-flight validation endpoint called by the timetable editor before saving
router.post('/', async (req, res, next) => {
    try {
        const {
            room_id,
            faculty_id,
            cohort_id,
            day_of_week,
            start_time,
            end_time,
            exclude_session_id
        } = req.body;

        const clashResult = await clashDetector.detectConflicts({
            room_id,
            faculty_id,
            cohort_id,
            day_of_week,
            start_time,
            end_time
        }, exclude_session_id);

        let alternateRooms = [];
        // If there is a room clash or user requested alternates, suggest free rooms!
        if (day_of_week && start_time && end_time) {
            try {
                const available = await roomFinder.findAvailableRooms({
                    day_of_week,
                    start_time,
                    end_time
                });
                alternateRooms = available.availableRooms;
            } catch (err) {
                // Ignore room search failure in clash detection
            }
        }

        res.json({
            success: true,
            hasClash: clashResult.hasClash,
            conflicts: clashResult.conflicts,
            warnings: clashResult.warnings,
            alternateRooms: alternateRooms.slice(0, 5) // Top 5 recommended rooms
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/clash-detect/audit-all
// Scans the complete timetable to detect any system-wide collisions
router.get('/audit-all', async (req, res, next) => {
    try {
        const audit = await clashDetector.auditFullTimetable();
        res.json({
            success: true,
            ...audit
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
