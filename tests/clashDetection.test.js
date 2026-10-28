const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const clashDetector = require('../src/services/clashDetector');
const db = require('../src/database/db');

describe('Clash Detection & Time Conflict Unit Tests', () => {

    beforeEach(async () => {
        await db.resetDemoData();
    });

    test('intervalsOverlap correctly identifies overlapping vs non-overlapping intervals', () => {
        // Overlap cases
        assert.strictEqual(clashDetector.intervalsOverlap('09:00', '10:00', '09:30', '10:30'), true);
        assert.strictEqual(clashDetector.intervalsOverlap('09:00', '11:00', '09:30', '10:30'), true);
        assert.strictEqual(clashDetector.intervalsOverlap('10:00', '11:00', '09:00', '10:30'), true);

        // Strict boundary: adjacent slots should NOT overlap
        assert.strictEqual(clashDetector.intervalsOverlap('09:00', '10:00', '10:00', '11:00'), false);
        assert.strictEqual(clashDetector.intervalsOverlap('11:00', '12:00', '09:00', '10:00'), false);
    });

    test('Detects Room Double-Booking Clash', async () => {
        // Monday 09:00-10:00 already has session in LH-101 (Turing Hall: b1010000-0000-0000-0000-000000000101)
        const proposed = {
            room_id: 'b1010000-0000-0000-0000-000000000101',
            faculty_id: 'f6000000-0000-0000-0000-000000000006', // Dr. Rachel Torres (free)
            cohort_id: 'c4000000-0000-0000-0000-000000000004',
            day_of_week: 'Monday',
            start_time: '09:00',
            end_time: '10:00'
        };

        const result = await clashDetector.detectConflicts(proposed);
        assert.strictEqual(result.hasClash, true);
        const roomClash = result.conflicts.find(c => c.type === 'ROOM');
        assert.ok(roomClash, 'Should return a ROOM clash');
        assert.match(roomClash.message, /already occupied/i);
    });

    test('Detects Faculty Double-Booking Clash', async () => {
        // Dr. Alan Sterling (f1000000-0000-0000-0000-000000000001) is teaching Monday 09:00-10:00
        const proposed = {
            room_id: 'b4010000-0000-0000-0000-000000000401', // Free room
            faculty_id: 'f1000000-0000-0000-0000-000000000001', // Alan Sterling (busy!)
            cohort_id: 'c4000000-0000-0000-0000-000000000004',
            day_of_week: 'Monday',
            start_time: '09:30',
            end_time: '10:30'
        };

        const result = await clashDetector.detectConflicts(proposed);
        assert.strictEqual(result.hasClash, true);
        const facultyClash = result.conflicts.find(c => c.type === 'FACULTY');
        assert.ok(facultyClash, 'Should return a FACULTY clash');
        assert.match(facultyClash.message, /Dr\. Alan Sterling/i);
    });

    test('Detects Cohort Double-Booking Clash', async () => {
        // Cohort CSE-2024-A (c1000000-0000-0000-0000-000000000001) has class Monday 09:00-10:00
        const proposed = {
            room_id: 'b4010000-0000-0000-0000-000000000401', // Free room
            faculty_id: 'f6000000-0000-0000-0000-000000000006', // Free faculty
            cohort_id: 'c1000000-0000-0000-0000-000000000001', // Cohort CSE-2024-A (busy!)
            day_of_week: 'Monday',
            start_time: '09:00',
            end_time: '10:00'
        };

        const result = await clashDetector.detectConflicts(proposed);
        assert.strictEqual(result.hasClash, true);
        const cohortClash = result.conflicts.find(c => c.type === 'COHORT');
        assert.ok(cohortClash, 'Should return a COHORT clash');
        assert.match(cohortClash.message, /CSE-2024-A/i);
    });

    test('Returns no clash when slot, faculty, cohort, and room are all clear', async () => {
        const proposed = {
            room_id: 'b4010000-0000-0000-0000-000000000401', // Free room
            faculty_id: 'f6000000-0000-0000-0000-000000000006', // Free faculty
            cohort_id: 'c3000000-0000-0000-0000-000000000003', // Free cohort at 14:00
            day_of_week: 'Monday',
            start_time: '14:00',
            end_time: '15:00'
        };

        const result = await clashDetector.detectConflicts(proposed);
        assert.strictEqual(result.hasClash, false);
        assert.strictEqual(result.conflicts.length, 0);
    });

    test('Flags Room Capacity Warning when cohort exceeds room limit', async () => {
        // Cohort CSE-2025-A has 70 students. Room CR-302 has capacity 40.
        const proposed = {
            room_id: 'b3020000-0000-0000-0000-000000000302', // capacity 40
            faculty_id: 'f6000000-0000-0000-0000-000000000006',
            cohort_id: 'c3000000-0000-0000-0000-000000000003', // 70 students
            day_of_week: 'Thursday',
            start_time: '14:00',
            end_time: '15:00'
        };

        const result = await clashDetector.detectConflicts(proposed);
        assert.strictEqual(result.hasClash, false);
        assert.strictEqual(result.warnings.length, 1);
        assert.strictEqual(result.warnings[0].type, 'CAPACITY_OVERFLOW');
        assert.match(result.warnings[0].message, /exceeding.*capacity/i);
    });
});
