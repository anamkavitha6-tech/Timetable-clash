// =========================================================================
// CHRONOCAMPUS - Timetable Grid Renderer (Week & Day Views)
// =========================================================================

const TimetableGrid = {
    currentViewMode: 'week', // 'week' | 'day'
    selectedDay: 'Monday',
    sessions: [],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    timeSlots: [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00'
    ],

    init() {
        // Event listeners for view mode toggle
        document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentViewMode = btn.dataset.mode;
                this.render();
            });
        });
    },

    setSessions(sessions) {
        this.sessions = sessions || [];
        this.render();
    },

    render() {
        const container = document.getElementById('timetableContainer');
        if (!container) return;

        if (this.currentViewMode === 'week') {
            this.renderWeekView(container);
        } else {
            this.renderDayView(container);
        }
    },

    renderWeekView(container) {
        if (!this.sessions.length) {
            container.innerHTML = `
                <div class="empty-placeholder">
                    <div class="empty-icon">📅</div>
                    <div class="empty-title">No Timetable Sessions Found</div>
                    <div class="empty-text">No academic sessions match your current filter criteria. Adjust the filters above or add a new scheduled session.</div>
                </div>
            `;
            return;
        }

        let html = `
            <div class="timetable-grid-container">
                <div class="timetable-week-grid">
                    <div class="grid-header-cell time-axis-header">Time</div>
                    ${this.days.map(d => `<div class="grid-header-cell">${d}</div>`).join('')}
        `;

        const isCoordinator = window.App ? window.App.canEditTimetable() : true;

        for (const slot of this.timeSlots) {
            const nextSlotHour = parseInt(slot.split(':')[0], 10) + 1;
            const slotEndStr = `${String(nextSlotHour).padStart(2, '0')}:00`;

            // Time Column Cell
            html += `
                <div class="grid-time-cell">
                    <span>${slot}</span>
                    <span style="font-size: 9px; color: var(--text-muted);">- ${slotEndStr}</span>
                </div>
            `;

            // Day Cells
            for (const day of this.days) {
                // Find all sessions on this day whose start time matches or falls inside this slot hour
                const matchingSessions = this.sessions.filter(s => {
                    if (s.day_of_week !== day) return false;
                    const sHour = parseInt(s.start_time.split(':')[0], 10);
                    const slotHour = parseInt(slot.split(':')[0], 10);
                    return sHour === slotHour;
                });

                html += `
                    <div class="grid-slot-cell" data-day="${day}" data-time="${slot}">
                `;

                if (matchingSessions.length > 0) {
                    for (const s of matchingSessions) {
                        const typeClass = `type-${(s.session_type || 'lecture').toLowerCase()}`;
                        const isRelocated = s.status === 'RELOCATED';

                        html += `
                            <div class="session-card ${typeClass} ${isRelocated ? 'status-relocated' : ''}" 
                                 onclick="window.App.openSessionDetails('${s.id}')"
                                 title="Click to view details or manage session">
                                <div class="session-card-header">
                                    <span class="session-code">${s.course ? s.course.course_code : 'Course'}</span>
                                    <span class="session-time">${s.start_time} - ${s.end_time}</span>
                                </div>
                                <div class="session-name">${s.course ? s.course.course_name : 'Class'}</div>
                                <div class="session-faculty-text">${s.faculty ? s.faculty.full_name : ''}</div>
                                <div class="session-meta-row">
                                    <span class="session-room-tag ${isRelocated ? 'relocated' : ''}">
                                        🏛️ ${s.room ? s.room.room_number.split(' ')[0] : 'Room'}
                                    </span>
                                    <span class="session-cohort-tag">${s.cohort ? s.cohort.code : 'Cohort'}</span>
                                </div>
                            </div>
                        `;
                    }
                }

                if (isCoordinator) {
                    html += `
                        <button class="cell-add-session-btn" onclick="window.App.openNewSessionModal('${day}', '${slot}')">
                            + Add Session
                        </button>
                    `;
                }

                html += `</div>`;
            }
        }

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    renderDayView(container) {
        // Group sessions on selectedDay sorted by start_time
        const daySessions = this.sessions
            .filter(s => s.day_of_week === this.selectedDay)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

        let html = `
            <div class="day-view-container">
                <div style="display: flex; gap: 8px; margin-bottom: 14px; overflow-x: auto; padding-bottom: 4px;">
                    ${this.days.map(d => `
                        <button class="btn ${d === this.selectedDay ? 'btn-primary' : 'btn-outline'} btn-sm"
                                onclick="TimetableGrid.selectDay('${d}')">
                            ${d}
                        </button>
                    `).join('')}
                </div>
        `;

        if (!daySessions.length) {
            html += `
                <div class="empty-placeholder">
                    <div class="empty-icon">☕</div>
                    <div class="empty-title">No Classes on ${this.selectedDay}</div>
                    <div class="empty-text">No active timetable sessions are scheduled for this day matching your filters.</div>
                </div>
            `;
        } else {
            for (const s of daySessions) {
                const isRelocated = s.status === 'RELOCATED';

                html += `
                    <div class="day-timeline-row">
                        <div class="day-timeline-time">
                            ${s.start_time} - ${s.end_time}
                            <div style="font-size: 11px; font-weight: normal; color: var(--text-muted); margin-top: 2px;">
                                ${s.session_type || 'Lecture'}
                            </div>
                        </div>
                        <div class="day-timeline-body">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                    <span style="font-weight: 700; font-size: 15px; color: var(--cobalt-900);">
                                        ${s.course ? s.course.course_code + ' — ' + s.course.course_name : 'Class'}
                                    </span>
                                    ${isRelocated ? `<span class="session-room-tag relocated">RELOCATED</span>` : ''}
                                </div>
                                <div style="font-size: 12px; color: var(--text-secondary); display: flex; gap: 16px; flex-wrap: wrap;">
                                    <span>👨‍🏫 <strong>${s.faculty ? s.faculty.full_name : 'Unassigned'}</strong></span>
                                    <span>👥 Cohort: <strong>${s.cohort ? s.cohort.code + ' (' + s.cohort.student_count + ' students)' : ''}</strong></span>
                                    <span>🏛️ Classroom: <strong>${s.room ? s.room.room_number : 'Room'}</strong> (Cap: ${s.room ? s.room.capacity : 0})</span>
                                </div>
                                ${s.notes ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; font-style: italic;">Note: ${s.notes}</div>` : ''}
                            </div>
                            <div>
                                <button class="btn btn-outline btn-sm" onclick="window.App.openSessionDetails('${s.id}')">
                                    Manage Session
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        html += `</div>`;
        container.innerHTML = html;
    },

    selectDay(day) {
        this.selectedDay = day;
        this.render();
    }
};

window.TimetableGrid = TimetableGrid;
