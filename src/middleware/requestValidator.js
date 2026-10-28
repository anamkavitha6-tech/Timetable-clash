function validateSessionPayload(req, res, next) {
    const { course_id, faculty_id, cohort_id, room_id, day_of_week, start_time, end_time } = req.body;

    const errors = [];
    if (!course_id) errors.push('course_id is required');
    if (!faculty_id) errors.push('faculty_id is required');
    if (!cohort_id) errors.push('cohort_id is required');
    if (!room_id) errors.push('room_id is required');

    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (!day_of_week || !validDays.includes(day_of_week)) {
        errors.push(`day_of_week must be one of: ${validDays.join(', ')}`);
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    if (!start_time || !timeRegex.test(start_time)) {
        errors.push('start_time must be in valid HH:MM format (24h)');
    }
    if (!end_time || !timeRegex.test(end_time)) {
        errors.push('end_time must be in valid HH:MM format (24h)');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_FAILED',
            details: errors
        });
    }

    next();
}

function validateChangeRequestPayload(req, res, next) {
    const { session_id, reason_details } = req.body;

    const errors = [];
    if (!session_id) errors.push('session_id is required');
    if (!reason_details || typeof reason_details !== 'string' || reason_details.trim().length < 5) {
        errors.push('reason_details must be provided and have at least 5 characters');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_FAILED',
            details: errors
        });
    }

    next();
}

module.exports = {
    validateSessionPayload,
    validateChangeRequestPayload
};
