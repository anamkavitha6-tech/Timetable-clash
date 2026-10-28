const db = require('../database/db');
const clashDetector = require('./clashDetector');

const changeRequestService = {
    /**
     * Submit a last-minute classroom change request.
     */
    async submitRequest({
        session_id,
        requested_by_name = 'Faculty Member',
        requested_by_role = 'Faculty',
        target_room_id = null,
        urgency = 'TODAY',
        reason_category = 'EQUIPMENT_FAILURE',
        reason_details
    }) {
        if (!session_id) {
            throw new Error('A valid timetable session_id is required.');
        }
        if (!reason_details || reason_details.trim().length < 5) {
            throw new Error('Please provide specific details explaining the reason for this classroom change.');
        }

        const session = await db.getSessionById(session_id);
        if (!session) {
            throw new Error(`Timetable session with ID ${session_id} not found.`);
        }

        const original_room_id = session.room_id;

        // If target room is specified, do a pre-flight conflict check
        let preflightClash = null;
        if (target_room_id) {
            preflightClash = await clashDetector.detectConflicts({
                room_id: target_room_id,
                day_of_week: session.day_of_week,
                start_time: session.start_time,
                end_time: session.end_time
            }, session.id);
        }

        const request = await db.createChangeRequest({
            session_id,
            requested_by_name,
            requested_by_role,
            original_room_id,
            target_room_id,
            urgency,
            reason_category,
            reason_details
        });

        // Log audit event
        await db.createAuditLog({
            session_id,
            change_request_id: request.id,
            action_type: 'REQUEST_SUBMITTED',
            details: `Change request filed by ${requested_by_name} (${urgency} priority): ${reason_details}`,
            previous_state: { room_id: original_room_id },
            new_state: { target_room_id },
            performed_by_role: requested_by_role,
            performed_by_name: requested_by_name
        });

        return {
            request,
            preflightClash
        };
    },

    /**
     * Coordinator approves or rejects a change request.
     */
    async reviewRequest(requestId, { action, target_room_id, reviewer_name = 'Academic Coordinator', reviewer_role = 'Academic Coordinator', review_notes = '' }) {
        const request = await db.getChangeRequestById(requestId);
        if (!request) {
            throw new Error(`Change request ${requestId} not found.`);
        }
        if (request.status !== 'PENDING_REVIEW') {
            throw new Error(`Request has already been processed with status: ${request.status}`);
        }

        const session = await db.getSessionById(request.session_id);
        if (!session) {
            throw new Error(`Underlying session ${request.session_id} no longer exists.`);
        }

        if (action === 'REJECT') {
            const updated = await db.updateChangeRequest(requestId, {
                status: 'REJECTED',
                reviewed_by: reviewer_name,
                review_notes: review_notes || 'Declined by coordinator.',
                reviewed_at: new Date().toISOString()
            });

            await db.createAuditLog({
                session_id: session.id,
                change_request_id: requestId,
                action_type: 'REQUEST_REJECTED',
                details: `Request rejected by ${reviewer_name}. Notes: ${review_notes || 'None'}`,
                previous_state: { status: 'PENDING_REVIEW' },
                new_state: { status: 'REJECTED' },
                performed_by_role: reviewer_role,
                performed_by_name: reviewer_name
            });

            return {
                success: true,
                request: updated,
                status: 'REJECTED'
            };
        }

        if (action === 'APPROVE') {
            const finalTargetRoomId = target_room_id || request.target_room_id;
            if (!finalTargetRoomId) {
                throw new Error('A replacement target room must be specified before approving.');
            }

            // Conflict check on target room at session's time slot
            const clashResult = await clashDetector.detectConflicts({
                room_id: finalTargetRoomId,
                day_of_week: session.day_of_week,
                start_time: session.start_time,
                end_time: session.end_time
            }, session.id);

            if (clashResult.hasClash) {
                const roomClashes = clashResult.conflicts.filter(c => c.type === 'ROOM');
                if (roomClashes.length > 0) {
                    throw new Error(`Cannot approve relocation: ${roomClashes[0].message}`);
                }
            }

            const targetRoom = await db.getRoomById(finalTargetRoomId);
            const originalRoom = await db.getRoomById(session.room_id);

            // Update underlying session
            const updatedSession = await db.updateSession(session.id, {
                room_id: finalTargetRoomId,
                status: 'RELOCATED',
                notes: `[Relocated from ${originalRoom ? originalRoom.room_number : 'prev room'}] ${session.notes || ''}`.trim()
            });

            // Update request
            const updatedRequest = await db.updateChangeRequest(requestId, {
                status: 'APPROVED',
                target_room_id: finalTargetRoomId,
                reviewed_by: reviewer_name,
                review_notes: review_notes || 'Relocation verified and approved.',
                reviewed_at: new Date().toISOString()
            });

            // Create audit log
            await db.createAuditLog({
                session_id: session.id,
                change_request_id: requestId,
                action_type: 'ROOM_RELOCATED',
                details: `Approved classroom shift from ${originalRoom ? originalRoom.room_number : 'Room'} to ${targetRoom ? targetRoom.room_number : 'New Room'}. Reason: ${request.reason_details}`,
                previous_state: { room_id: session.room_id, room_name: originalRoom ? originalRoom.room_number : '' },
                new_state: { room_id: finalTargetRoomId, room_name: targetRoom ? targetRoom.room_number : '' },
                performed_by_role: reviewer_role,
                performed_by_name: reviewer_name
            });

            // Automatically broadcast an In-App Notice to students & faculty!
            const noticeTitle = `RELOCATION: ${session.course ? session.course.course_code : 'Class'} Moved to ${targetRoom ? targetRoom.room_number : 'New Room'}`;
            const noticeMsg = `${session.course ? session.course.course_name : 'Class'} (${session.cohort ? session.cohort.code : 'Cohort'}) scheduled for ${session.day_of_week} at ${session.start_time} has been relocated to ${targetRoom ? targetRoom.room_number : 'new room'}. Reason: ${request.reason_details}`;

            const notice = await db.createNotice({
                title: noticeTitle,
                message: noticeMsg,
                urgency: request.urgency === 'IMMEDIATE' ? 'CRITICAL' : 'WARNING',
                session_id: session.id,
                cohort_id: session.cohort_id,
                room_id: finalTargetRoomId,
                is_pinned: true
            });

            // Simulated external notification dispatch (SMS / Email / Student Portal Webhook)
            const notificationDispatch = {
                dispatched_at: new Date().toISOString(),
                channels: ['In-App Notice Board', 'Campus Alert Ticker', 'Student Portal Push Webhook (Simulated)'],
                affectedCohort: session.cohort ? session.cohort.code : 'Cohort',
                recipientCount: session.cohort ? session.cohort.student_count : 60,
                deliveryStatus: 'DELIVERED_OK'
            };

            return {
                success: true,
                status: 'APPROVED',
                request: updatedRequest,
                session: updatedSession,
                notice,
                notificationDispatch
            };
        }

        throw new Error(`Invalid action "${action}". Must be "APPROVE" or "REJECT".`);
    },

    /**
     * Direct Coordinator Quick Relocate (Emergency relocation on the fly)
     */
    async quickRelocate({ session_id, target_room_id, reason, coordinator_name = 'Academic Coordinator' }) {
        if (!session_id || !target_room_id || !reason) {
            throw new Error('session_id, target_room_id, and reason are required.');
        }

        const session = await db.getSessionById(session_id);
        if (!session) {
            throw new Error('Session not found.');
        }

        // Conflict check
        const clashResult = await clashDetector.detectConflicts({
            room_id: target_room_id,
            day_of_week: session.day_of_week,
            start_time: session.start_time,
            end_time: session.end_time
        }, session.id);

        if (clashResult.hasClash) {
            const roomClash = clashResult.conflicts.find(c => c.type === 'ROOM');
            if (roomClash) {
                throw new Error(`Cannot relocate: ${roomClash.message}`);
            }
        }

        const [origRoom, newRoom] = await Promise.all([
            db.getRoomById(session.room_id),
            db.getRoomById(target_room_id)
        ]);

        const updatedSession = await db.updateSession(session.id, {
            room_id: target_room_id,
            status: 'RELOCATED',
            notes: `[Emergency Relocated] ${reason}`
        });

        // Audit Log
        await db.createAuditLog({
            session_id: session.id,
            action_type: 'EMERGENCY_OVERRIDE',
            details: `Coordinator emergency shift: ${origRoom ? origRoom.room_number : 'Room'} -> ${newRoom ? newRoom.room_number : 'Room'}. Reason: ${reason}`,
            previous_state: { room_id: session.room_id, room_name: origRoom ? origRoom.room_number : '' },
            new_state: { room_id: target_room_id, room_name: newRoom ? newRoom.room_number : '' },
            performed_by_role: 'Academic Coordinator',
            performed_by_name: coordinator_name
        });

        // Notice
        const notice = await db.createNotice({
            title: `EMERGENCY RELOCATION: ${session.course ? session.course.course_code : 'Class'} Moved to ${newRoom ? newRoom.room_number : 'New Room'}`,
            message: `${session.course ? session.course.course_name : 'Class'} (${session.cohort ? session.cohort.code : 'Cohort'}) on ${session.day_of_week} at ${session.start_time} relocated immediately. Reason: ${reason}`,
            urgency: 'CRITICAL',
            session_id: session.id,
            cohort_id: session.cohort_id,
            room_id: target_room_id,
            is_pinned: true
        });

        return {
            success: true,
            session: updatedSession,
            notice
        };
    }
};

module.exports = changeRequestService;
