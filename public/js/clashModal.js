// =========================================================================
// CHRONOCAMPUS - Clash Detection & Session Modal Manager
// Real-time conflict engine UI with auto-recommended alternate rooms
// =========================================================================

const ClashModal = {
    debounceTimer: null,
    editingSessionId: null,

    init() {
        // Attach live input listeners for real-time clash check
        const fields = ['sessionDay', 'sessionStartTime', 'sessionEndTime', 'sessionRoom', 'sessionFaculty', 'sessionCohort'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.triggerLiveClashCheck());
                el.addEventListener('input', () => this.triggerLiveClashCheck());
            }
        });

        // Form submit
        const form = document.getElementById('sessionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSession();
            });
        }
    },

    triggerLiveClashCheck() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.runClashCheck();
        }, 300);
    },

    async runClashCheck() {
        const payload = this.getFormData();
        const feedbackContainer = document.getElementById('sessionClashFeedback');
        if (!feedbackContainer) return;

        // Ensure minimum required fields exist for meaningful check
        if (!payload.day_of_week || !payload.start_time || !payload.end_time) {
            feedbackContainer.innerHTML = '';
            return;
        }

        try {
            feedbackContainer.innerHTML = `
                <div style="font-size: 11.5px; color: var(--cobalt-600); display: flex; align-items: center; gap: 6px; padding: 6px 0;">
                    <span class="status-dot pulse" style="background-color: var(--cobalt-600);"></span>
                    Verifying timetable conflicts across rooms, faculty, and cohorts...
                </div>
            `;

            const checkPayload = {
                ...payload,
                exclude_session_id: this.editingSessionId
            };

            const result = await API.detectClash(checkPayload);

            if (result.hasClash) {
                let html = `
                    <div class="clash-alert-box">
                        <div class="clash-alert-title">
                            ⚠️ Timetable Conflict Detected (${result.conflicts.length})
                        </div>
                        <ul class="clash-alert-list">
                            ${result.conflicts.map(c => `<li><strong>${c.title}:</strong> ${c.message}</li>`).join('')}
                        </ul>
                `;

                // If alternate rooms are available, show recommendations!
                if (result.alternateRooms && result.alternateRooms.length > 0) {
                    html += `
                        <div class="alternate-rooms-section">
                            <div class="alternate-rooms-title">
                                💡 Available Alternative Classrooms (${result.alternateRooms.length} free right now):
                            </div>
                            <div class="alternate-rooms-grid">
                                ${result.alternateRooms.map(r => `
                                    <div class="alt-room-card" onclick="ClashModal.selectAlternateRoom('${r.id}')" title="Click to assign this room">
                                        <div>
                                            <div class="alt-room-name">${r.room_number}</div>
                                            <div class="alt-room-capacity">Cap: ${r.capacity} seats • ${r.room_type}</div>
                                        </div>
                                        <button type="button" class="btn btn-outline btn-sm" style="font-size: 10.5px;">Select</button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }

                html += `</div>`;
                feedbackContainer.innerHTML = html;
            } else {
                let html = `
                    <div style="background-color: var(--emerald-50); border: 1px solid #a7f3d0; border-left: 4px solid var(--emerald-600); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px; color: #065f46; display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <span>✅</span>
                        <span><strong>Conflict-Free:</strong> Selected classroom, faculty member, and cohort are clear with zero overlaps.</span>
                    </div>
                `;

                if (result.warnings && result.warnings.length > 0) {
                    html += `
                        <div class="warning-alert-box">
                            ${result.warnings.map(w => `<div>⚠️ <strong>${w.title}:</strong> ${w.message}</div>`).join('')}
                        </div>
                    `;
                }

                feedbackContainer.innerHTML = html;
            }
        } catch (err) {
            console.error('Clash check failed:', err);
        }
    },

    selectAlternateRoom(roomId) {
        const roomSelect = document.getElementById('sessionRoom');
        if (roomSelect) {
            roomSelect.value = roomId;
            window.App.showToast('Replacement classroom selected. Re-evaluating schedule...', 'info');
            this.runClashCheck();
        }
    },

    getFormData() {
        return {
            course_id: document.getElementById('sessionCourse')?.value || '',
            faculty_id: document.getElementById('sessionFaculty')?.value || '',
            cohort_id: document.getElementById('sessionCohort')?.value || '',
            room_id: document.getElementById('sessionRoom')?.value || '',
            day_of_week: document.getElementById('sessionDay')?.value || 'Monday',
            start_time: document.getElementById('sessionStartTime')?.value || '09:00',
            end_time: document.getElementById('sessionEndTime')?.value || '10:00',
            session_type: document.getElementById('sessionType')?.value || 'Lecture',
            notes: document.getElementById('sessionNotes')?.value || ''
        };
    },

    async saveSession() {
        const data = this.getFormData();

        if (!data.course_id || !data.faculty_id || !data.cohort_id || !data.room_id) {
            window.App.showToast('Please select Course, Faculty, Cohort, and Room.', 'error');
            return;
        }

        try {
            if (this.editingSessionId) {
                await API.updateSession(this.editingSessionId, data);
                window.App.showToast('Timetable session updated successfully.', 'success');
            } else {
                await API.createSession(data);
                window.App.showToast('New timetable session scheduled successfully.', 'success');
            }

            this.closeModal();
            window.App.refreshAllData();
        } catch (err) {
            if (err.status === 409) {
                window.App.showToast('Cannot save: Timetable overlap detected! Check warnings.', 'error');
            } else {
                window.App.showToast(err.message || 'Failed to save session.', 'error');
            }
        }
    },

    async deleteCurrentSession() {
        if (!this.editingSessionId) return;

        if (!confirm('Are you sure you want to remove this timetable session?')) return;

        try {
            await API.deleteSession(this.editingSessionId);
            window.App.showToast('Session removed from timetable.', 'success');
            this.closeModal();
            window.App.refreshAllData();
        } catch (err) {
            window.App.showToast(err.message || 'Failed to delete session.', 'error');
        }
    },

    openNew(day = 'Monday', time = '09:00') {
        this.editingSessionId = null;
        document.getElementById('sessionModalTitle').textContent = 'Schedule New Timetable Session';
        document.getElementById('btnDeleteSession').style.display = 'none';

        document.getElementById('sessionForm').reset();
        if (day) document.getElementById('sessionDay').value = day;
        if (time) {
            document.getElementById('sessionStartTime').value = time;
            const hour = parseInt(time.split(':')[0], 10) + 1;
            document.getElementById('sessionEndTime').value = `${String(hour).padStart(2, '0')}:00`;
        }

        document.getElementById('sessionClashFeedback').innerHTML = '';
        this.openModal();
        this.triggerLiveClashCheck();
    },

    openEdit(session) {
        this.editingSessionId = session.id;
        document.getElementById('sessionModalTitle').textContent = `Edit Session: ${session.course ? session.course.course_code : ''}`;
        document.getElementById('btnDeleteSession').style.display = 'inline-flex';

        document.getElementById('sessionCourse').value = session.course_id;
        document.getElementById('sessionFaculty').value = session.faculty_id;
        document.getElementById('sessionCohort').value = session.cohort_id;
        document.getElementById('sessionRoom').value = session.room_id;
        document.getElementById('sessionDay').value = session.day_of_week;
        document.getElementById('sessionStartTime').value = session.start_time;
        document.getElementById('sessionEndTime').value = session.end_time;
        document.getElementById('sessionType').value = session.session_type || 'Lecture';
        document.getElementById('sessionNotes').value = session.notes || '';

        document.getElementById('sessionClashFeedback').innerHTML = '';
        this.openModal();
        this.triggerLiveClashCheck();
    },

    openModal() {
        document.getElementById('sessionModalOverlay').classList.add('open');
    },

    closeModal() {
        document.getElementById('sessionModalOverlay').classList.remove('open');
        this.editingSessionId = null;
    }
};

window.ClashModal = ClashModal;
