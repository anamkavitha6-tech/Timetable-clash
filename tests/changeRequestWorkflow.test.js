const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const changeRequestService = require('../src/services/changeRequestService');
const db = require('../src/database/db');

describe('Approved Change Request Workflow & Audit Unit Tests', () => {

    beforeEach(async () => {
        await db.resetDemoData();
    });

    test('Faculty can submit a change request for a timetable session', async () => {
        const sessionId = 'a1000000-0000-0000-0000-000000000001'; // Monday Algorithms
        const result = await changeRequestService.submitRequest({
            session_id: sessionId,
            requested_by_name: 'Dr. Alan Sterling',
            requested_by_role: 'Faculty',
            urgency: 'IMMEDIATE',
            reason_category: 'EQUIPMENT_FAILURE',
            reason_details: 'Main overhead display HDMI port burned out.'
        });

        assert.ok(result.request);
        assert.strictEqual(result.request.session_id, sessionId);
        assert.strictEqual(result.request.status, 'PENDING_REVIEW');
        assert.strictEqual(result.request.urgency, 'IMMEDIATE');

        // Check audit log was written
        const logs = await db.getAuditLogs(10);
        const submitLog = logs.find(l => l.action_type === 'REQUEST_SUBMITTED' && l.session_id === sessionId);
        assert.ok(submitLog, 'REQUEST_SUBMITTED audit log should exist');
    });

    test('Coordinator can approve request: updates session room, marks APPROVED, generates in-app notice', async () => {
        const reqResult = await changeRequestService.submitRequest({
            session_id: 'a1000000-0000-0000-0000-000000000003',
            requested_by_name: 'Dr. Sarah Chen',
            requested_by_role: 'Faculty',
            urgency: 'IMMEDIATE',
            reason_category: 'MAINTENANCE',
            reason_details: 'AC cooling unit leaking water onto back benches. Relocation needed.'
        });
        const requestId = reqResult.request.id;
        const targetRoomId = 'b3030000-0000-0000-0000-000000000303'; // Dijkstra Lab

        const result = await changeRequestService.reviewRequest(requestId, {
            action: 'APPROVE',
            target_room_id: targetRoomId,
            reviewer_name: 'Dr. Patricia Ward',
            reviewer_role: 'Academic Coordinator',
            review_notes: 'Reviewed room suitability and AC repair dispatch.'
        });

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.status, 'APPROVED');
        assert.strictEqual(result.request.status, 'APPROVED');
        assert.strictEqual(result.session.room_id, targetRoomId);
        assert.strictEqual(result.session.status, 'RELOCATED');

        // Verify In-App Notice was generated
        assert.ok(result.notice);
        assert.strictEqual(result.notice.room_id, targetRoomId);
        assert.strictEqual(result.notice.is_pinned, true);

        // Verify simulated notification dispatch
        assert.ok(result.notificationDispatch);
        assert.strictEqual(result.notificationDispatch.deliveryStatus, 'DELIVERED_OK');

        // Verify audit log has ROOM_RELOCATED
        const logs = await db.getAuditLogs(10);
        const approvedLog = logs.find(l => l.action_type === 'ROOM_RELOCATED' && l.change_request_id === requestId);
        assert.ok(approvedLog, 'ROOM_RELOCATED audit log must be recorded');
    });

    test('Blocks approval if target room has a collision at that time', async () => {
        const reqResult = await changeRequestService.submitRequest({
            session_id: 'a1000000-0000-0000-0000-000000000003',
            requested_by_name: 'Dr. Sarah Chen',
            requested_by_role: 'Faculty',
            urgency: 'IMMEDIATE',
            reason_category: 'MAINTENANCE',
            reason_details: 'Testing collision rejection.'
        });
        const requestId = reqResult.request.id;
        const occupiedRoomId = 'b1010000-0000-0000-0000-000000000101'; // LH-101 has Algorithms at Mon 09:00-10:00

        await assert.rejects(
            async () => {
                await changeRequestService.reviewRequest(requestId, {
                    action: 'APPROVE',
                    target_room_id: occupiedRoomId,
                    reviewer_name: 'Coordinator'
                });
            },
            /already occupied/i
        );
    });

    test('Coordinator can reject request with recorded notes', async () => {
        const reqResult = await changeRequestService.submitRequest({
            session_id: 'a3000000-0000-0000-0000-000000000002',
            requested_by_name: 'Prof. Elena Vance',
            requested_by_role: 'Faculty',
            urgency: 'TODAY',
            reason_category: 'OVERFLOW',
            reason_details: 'Combined cohort lecture revision.'
        });
        const requestId = reqResult.request.id;

        const result = await changeRequestService.reviewRequest(requestId, {
            action: 'REJECT',
            reviewer_name: 'Dr. Patricia Ward',
            review_notes: 'Alternative larger auditorium AUD-102 reserved for faculty meeting.'
        });

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.status, 'REJECTED');
        assert.strictEqual(result.request.status, 'REJECTED');

        const logs = await db.getAuditLogs(10);
        const rejectLog = logs.find(l => l.action_type === 'REQUEST_REJECTED' && l.change_request_id === requestId);
        assert.ok(rejectLog);
    });
});
