// =========================================================================
// CHRONOCAMPUS - Change Request Coordinator & Approval Engine
// =========================================================================

const ChangeRequests = {
    requests: [],
    currentReviewId: null,

    init() {
        const submitForm = document.getElementById('changeRequestForm');
        if (submitForm) {
            submitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitRequest();
            });
        }
    },

    setRequests(requests) {
        this.requests = requests || [];
        this.renderQueue();
    },

    renderQueue() {
        const container = document.getElementById('requestsQueueContainer');
        if (!container) return;

        if (!this.requests.length) {
            container.innerHTML = `
                <div class="empty-placeholder">
                    <div class="empty-icon">✨</div>
                    <div class="empty-title">No Change Requests in Queue</div>
                    <div class="empty-text">All classroom relocation requests have been reviewed and resolved.</div>
                </div>
            `;
            return;
        }

        const isCoordinator = window.App ? window.App.canApproveRequests() : true;

        let html = '<div class="requests-queue">';

        for (const req of this.requests) {
            const urgencyClass = `urgency-${(req.urgency || 'today').toLowerCase()}`;
            const statusClass = (req.status || 'PENDING_REVIEW').toLowerCase().replace('_', '-');
            const origRoomName = req.original_room ? req.original_room.room_number : 'Original Room';
            const targetRoomName = req.target_room ? req.target_room.room_number : 'Auto-Assign Best Room';

            const session = req.session;
            const courseInfo = session && session.course ? `${session.course.course_code}: ${session.course.course_name}` : 'Session';
            const timeInfo = session ? `${session.day_of_week} ${session.start_time} - ${session.end_time}` : '';
            const cohortInfo = session && session.cohort ? session.cohort.code : '';

            html += `
                <div class="request-item-card ${urgencyClass}">
                    <div class="request-card-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="urgency-badge ${(req.urgency || 'today').toLowerCase()}">${req.urgency} Priority</span>
                            <span style="font-weight: 700; font-size: 14px; color: var(--cobalt-900);">${courseInfo}</span>
                            <span class="session-cohort-tag">${cohortInfo}</span>
                        </div>
                        <span class="request-status-badge ${statusClass}">${req.status.replace('_', ' ')}</span>
                    </div>

                    <div class="request-rooms-comparison">
                        <span>🏛️ From: <strong>${origRoomName}</strong></span>
                        <span style="color: var(--text-muted); font-size: 14px;">➔</span>
                        <span>🎯 Requested: <strong>${targetRoomName}</strong></span>
                        <span style="margin-left: auto; font-family: var(--font-mono); font-size: 11px; color: var(--cobalt-800);">
                            ⏰ ${timeInfo}
                        </span>
                    </div>

                    <div class="request-reason-text">
                        <strong>Reason (${req.reason_category.replace('_', ' ')}):</strong> ${req.reason_details}
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted); padding-top: 4px;">
                        <span>Requested by: <strong>${req.requested_by_name}</strong> (${new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                        ${req.reviewed_by ? `<span>Reviewed by: <strong>${req.reviewed_by}</strong> (${req.review_notes || 'Approved'})</span>` : ''}
                    </div>

                    ${req.status === 'PENDING_REVIEW' && isCoordinator ? `
                        <div class="request-actions-bar">
                            <button class="btn btn-outline btn-sm" onclick="ChangeRequests.openReviewModal('${req.id}', 'REJECT')">
                                Decline
                            </button>
                            <button class="btn btn-amber btn-sm" onclick="ChangeRequests.openReviewModal('${req.id}', 'APPROVE')">
                                Review & Approve Relocation
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    },

    openSubmitModal(sessionId = null) {
        document.getElementById('changeRequestForm').reset();
        const sessionSelect = document.getElementById('reqSessionSelect');

        if (sessionId && sessionSelect) {
            sessionSelect.value = sessionId;
        }

        document.getElementById('requestModalOverlay').classList.add('open');
    },

    closeSubmitModal() {
        document.getElementById('requestModalOverlay').classList.remove('open');
    },

    async submitRequest() {
        const sessionId = document.getElementById('reqSessionSelect').value;
        const targetRoomId = document.getElementById('reqTargetRoom').value || null;
        const urgency = document.getElementById('reqUrgency').value;
        const reasonCategory = document.getElementById('reqReasonCategory').value;
        const reasonDetails = document.getElementById('reqReasonDetails').value;

        if (!sessionId) {
            window.App.showToast('Please select a session to relocate.', 'error');
            return;
        }
        if (!reasonDetails || reasonDetails.trim().length < 5) {
            window.App.showToast('Please enter at least 5 characters for the reason.', 'error');
            return;
        }

        try {
            await API.submitChangeRequest({
                session_id: sessionId,
                target_room_id: targetRoomId,
                urgency,
                reason_category: reasonCategory,
                reason_details: reasonDetails
            });

            window.App.showToast('Last-minute classroom change request submitted to coordinator queue.', 'success');
            this.closeSubmitModal();
            window.App.refreshAllData();
        } catch (err) {
            window.App.showToast(err.message || 'Failed to submit request.', 'error');
        }
    },

    async openReviewModal(requestId, initialAction = 'APPROVE') {
        this.currentReviewId = requestId;
        const req = this.requests.find(r => r.id === requestId);
        if (!req) return;

        document.getElementById('reviewReqTitle').textContent = `Review Request: ${req.session?.course?.course_code || 'Session'}`;
        document.getElementById('reviewReqDetails').innerHTML = `
            <div style="margin-bottom: 12px; font-size: 13px;">
                <p><strong>Session:</strong> ${req.session?.course?.course_name || ''} (${req.session?.cohort?.code || ''})</p>
                <p><strong>Scheduled Slot:</strong> ${req.session?.day_of_week || ''} ${req.session?.start_time || ''} - ${req.session?.end_time || ''}</p>
                <p><strong>Current Classroom:</strong> ${req.original_room?.room_number || ''}</p>
                <p><strong>Reason:</strong> ${req.reason_details}</p>
            </div>
        `;

        const roomSelect = document.getElementById('reviewTargetRoom');
        if (roomSelect) {
            roomSelect.value = req.target_room_id || '';
        }

        document.getElementById('reviewNotes').value = '';
        document.getElementById('reviewModalOverlay').classList.add('open');
    },

    closeReviewModal() {
        document.getElementById('reviewModalOverlay').classList.remove('open');
        this.currentReviewId = null;
    },

    async processReview(action) {
        if (!this.currentReviewId) return;

        const targetRoomId = document.getElementById('reviewTargetRoom').value;
        const reviewNotes = document.getElementById('reviewNotes').value;

        if (action === 'APPROVE' && !targetRoomId) {
            window.App.showToast('Please select a destination replacement room.', 'error');
            return;
        }

        try {
            const res = await API.reviewChangeRequest(this.currentReviewId, {
                action,
                target_room_id: targetRoomId,
                review_notes: reviewNotes
            });

            window.App.showToast(
                action === 'APPROVE'
                    ? 'Classroom change approved! Timetable updated & campus notice broadcast.'
                    : 'Request marked as declined.',
                'success'
            );

            this.closeReviewModal();
            window.App.refreshAllData();
        } catch (err) {
            window.App.showToast(err.message || 'Error processing review.', 'error');
        }
    }
};

window.ChangeRequests = ChangeRequests;
