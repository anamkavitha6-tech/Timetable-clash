const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/meta/departments
router.get('/departments', async (req, res, next) => {
    try {
        const departments = await db.getDepartments();
        res.json({ success: true, data: departments });
    } catch (err) {
        next(err);
    }
});

// GET /api/meta/faculties
router.get('/faculties', async (req, res, next) => {
    try {
        const faculties = await db.getFaculties();
        res.json({ success: true, data: faculties });
    } catch (err) {
        next(err);
    }
});

// GET /api/meta/cohorts
router.get('/cohorts', async (req, res, next) => {
    try {
        const cohorts = await db.getCohorts();
        res.json({ success: true, data: cohorts });
    } catch (err) {
        next(err);
    }
});

// GET /api/meta/courses
router.get('/courses', async (req, res, next) => {
    try {
        const courses = await db.getCourses();
        res.json({ success: true, data: courses });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
