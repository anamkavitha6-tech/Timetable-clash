const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../server');
const db = require('../src/database/db');

let server;
let baseUrl;

describe('REST API & Role Authorization Tests', () => {

    before(async () => {
        return new Promise((resolve) => {
            server = http.createServer(app);
            server.listen(0, () => {
                const port = server.address().port;
                baseUrl = `http://localhost:${port}`;
                resolve();
            });
        });
    });

    after(async () => {
        return new Promise((resolve) => {
            server.close(resolve);
        });
    });

    beforeEach(async () => {
        await db.resetDemoData();
    });

    test('GET /api/health returns healthy status', async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.status, 'HEALTHY');
    });

    test('GET /api/timetable returns session collection with relations', async () => {
        const res = await fetch(`${baseUrl}/api/timetable`);
        assert.strictEqual(res.status, 200);
        const body = await res.json();
        assert.strictEqual(body.success, true);
        assert.ok(Array.isArray(body.data));
        assert.ok(body.data.length > 0);

        const first = body.data[0];
        assert.ok(first.course && first.course.course_code, 'Session must include course relation');
        assert.ok(first.room && first.room.room_number, 'Session must include room relation');
        assert.ok(first.cohort && first.cohort.code, 'Session must include cohort relation');
    });

    test('GET /api/rooms/available finds free rooms for specific slot', async () => {
        const res = await fetch(`${baseUrl}/api/rooms/available?day=Monday&start=14:00&end=15:00`);
        assert.strictEqual(res.status, 200);
        const body = await res.json();
        assert.strictEqual(body.success, true);
        assert.ok(body.data.availableCount > 0);
        assert.ok(Array.isArray(body.data.availableRooms));
    });

    test('POST /api/clash-detect reports conflicts without persisting', async () => {
        // Colliding session with existing Monday 09:00 Turing Hall
        const payload = {
            room_id: 'b1010000-0000-0000-0000-000000000101',
            day_of_week: 'Monday',
            start_time: '09:00',
            end_time: '10:00'
        };

        const res = await fetch(`${baseUrl}/api/clash-detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        assert.strictEqual(res.status, 200);
        const body = await res.json();
        assert.strictEqual(body.success, true);
        assert.strictEqual(body.hasClash, true);
        assert.ok(body.conflicts.length > 0);
        assert.ok(Array.isArray(body.alternateRooms), 'Should include alternate free rooms');
    });

    test('Role Boundary: Visitor is forbidden from creating session (403)', async () => {
        const payload = {
            course_id: 'e1000000-0000-0000-0000-000000000001',
            faculty_id: 'f1000000-0000-0000-0000-000000000001',
            cohort_id: 'c1000000-0000-0000-0000-000000000001',
            room_id: 'b4010000-0000-0000-0000-000000000401',
            day_of_week: 'Thursday',
            start_time: '14:00',
            end_time: '15:00'
        };

        const res = await fetch(`${baseUrl}/api/timetable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': 'visitor'
            },
            body: JSON.stringify(payload)
        });

        assert.strictEqual(res.status, 403);
        const body = await res.json();
        assert.strictEqual(body.success, false);
        assert.strictEqual(body.error, 'FORBIDDEN');
    });

    test('Role Boundary: Coordinator can create session if conflict-free', async () => {
        const payload = {
            course_id: 'e1000000-0000-0000-0000-000000000001',
            faculty_id: 'f1000000-0000-0000-0000-000000000001',
            cohort_id: 'c1000000-0000-0000-0000-000000000001',
            room_id: 'b4010000-0000-0000-0000-000000000401', // Free room
            day_of_week: 'Saturday',
            start_time: '16:00',
            end_time: '17:00',
            session_type: 'Tutorial'
        };

        const res = await fetch(`${baseUrl}/api/timetable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': 'coordinator',
                'x-user-name': 'Dr. Patricia Ward'
            },
            body: JSON.stringify(payload)
        });

        assert.strictEqual(res.status, 201);
        const body = await res.json();
        assert.strictEqual(body.success, true);
        assert.ok(body.data.id);

        // Clean up created session
        if (body.data && body.data.id) {
            await fetch(`${baseUrl}/api/timetable/${body.data.id}`, {
                method: 'DELETE',
                headers: {
                    'x-user-role': 'coordinator',
                    'x-user-name': 'Dr. Patricia Ward'
                }
            });
        }
    });

    test('GET /api/csv/export downloads valid CSV content', async () => {
        const res = await fetch(`${baseUrl}/api/csv/export`);
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get('content-type').includes('text/csv'));
        const text = await res.text();
        assert.ok(text.startsWith('Day,StartTime,EndTime,CourseCode'));
        assert.ok(text.includes('CS-301'));
    });

    test('GET /api/system/metrics returns accurate operational KPIs', async () => {
        const res = await fetch(`${baseUrl}/api/system/metrics`);
        assert.strictEqual(res.status, 200);
        const body = await res.json();
        assert.strictEqual(body.success, true);
        assert.ok(body.data.totalSessions > 0);
        assert.ok(typeof body.data.utilizationRate === 'number');
        assert.ok(typeof body.data.activeClashesCount === 'number');
    });
});
