const express = require('express');
const router = express.Router();
const db = require('../database/db');
const roomFinder = require('../services/roomFinder');

// GET /api/rooms
router.get('/', async (req, res, next) => {
    try {
        const rooms = await db.getRooms();
        res.json({
            success: true,
            count: rooms.length,
            data: rooms
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/rooms/available
// Real-time lookup of available classrooms for a specific slot
router.get('/available', async (req, res, next) => {
    try {
        const { day, start, end, min_capacity, room_type, projector } = req.query;

        if (!day || !start || !end) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMS',
                message: 'Query params "day", "start", and "end" are required.'
            });
        }

        const result = await roomFinder.findAvailableRooms({
            day_of_week: day,
            start_time: start,
            end_time: end,
            min_capacity: min_capacity ? parseInt(min_capacity, 10) : 0,
            room_type: room_type || null,
            require_projector: projector === 'true'
        });

        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
