// =========================================================================
// CHRONOCAMPUS - Master Application Controller
// Orchestrates state, roles, views, filters, and modals
// =========================================================================

const App = {
    currentRole: 'coordinator',
    currentUserName: 'Dr. Patricia Ward',
    activeTab: 'planner',
    metadata: {
        departments: [],
        faculties: [],
        cohorts: [],
        courses: [],
        rooms: []
    },
    sessions: [],
    changeRequests: [],
    notices: [],
    auditLogs: [],
    metrics: {},

    async init() {
        // Restore role preference if stored
        const savedRole = localStorage.getItem('chronocampus_role');
        const savedName = localStorage.getItem('chronocampus_user_name');
        if (savedRole) this.currentRole = savedRole;
        if (savedName) this.currentUserName = savedName;

        API.setRole(this.currentRole, this.currentUserName);

        this.setupNavigation();
        this.setupRoleSwitcher();
        this.setupFilterListeners();
        this.setupLiveRoomChecker();

        // Initialize sub-modules
        TimetableGrid.init();
        ClashModal.init();
        ChangeRequests.init();
        NoticeTicker.init();
        CSVManager.init();

        // Hydrate Application
        await this.loadMetadata();
        await this.refreshAllData();
        this.checkDatabaseStatus();
    },

    setupNavigation() {
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const targetTab = btn.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    },

    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.view-section').forEach(sec => {
            sec.classList.remove('active-view');
        });

        const activeSec = document.getElementById(`view-${tabId}`);
        if (activeSec) {
            activeSec.classList.add('active-view');
        }

        // Render specific tab content if needed
        if (tabId === 'rooms') {
            this.renderRoomsDirectory();
        } else if (tabId === 'audit') {
            this.renderAuditTimeline();
        }
    },

    setupRoleSwitcher() {
        const rolePills = document.querySelectorAll('.role-pill');
        rolePills.forEach(pill => {
            pill.addEventListener('click', () => {
                const newRole = pill.dataset.role;
                this.setRole(newRole);
            });
        });

        this.updateRoleUI();
    },

    setRole(role) {
        this.currentRole = role;
        if (role === 'admin') this.currentUserName = 'System Admin';
        else if (role === 'coordinator') this.currentUserName = 'Dr. Patricia Ward';
        else if (role === 'faculty') this.currentUserName = 'Prof. David Miller';
        else this.currentUserName = 'Student Visitor';

        API.setRole(this.currentRole, this.currentUserName);
        this.updateRoleUI();
        this.showToast(`Switched active perspective to: ${this.getRoleDisplayName(role)}`, 'info');

        // Re-render components with role permissions applied
        TimetableGrid.render();
        ChangeRequests.renderQueue();
        NoticeTicker.renderNoticesDrawer();
    },

    updateRoleUI() {
        document.querySelectorAll('.role-pill').forEach(pill => {
            if (pill.dataset.role === this.currentRole) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });

        const userBadge = document.getElementById('currentUserBadge');
        if (userBadge) {
            userBadge.textContent = `${this.currentUserName} (${this.getRoleDisplayName(this.currentRole)})`;
        }

        // Toggle Coordinator / Admin specific buttons
        const coordinatorActions = document.querySelectorAll('.coordinator-only');
        coordinatorActions.forEach(el => {
            el.style.display = this.canEditTimetable() ? 'inline-flex' : 'none';
        });

        const adminActions = document.querySelectorAll('.admin-only');
        adminActions.forEach(el => {
            el.style.display = (this.currentRole === 'admin') ? 'inline-flex' : 'none';
        });
    },

    getRoleDisplayName(role) {
        const names = {
            visitor: 'Student / Visitor',
            faculty: 'Faculty Member',
            coordinator: 'Academic Coordinator',
            admin: 'Administrator'
        };
        return names[role] || role;
    },

    canEditTimetable() {
        return this.currentRole === 'coordinator' || this.currentRole === 'admin';
    },

    canApproveRequests() {
        return this.currentRole === 'coordinator' || this.currentRole === 'admin';
    },

    canPublishNotices() {
        return this.currentRole === 'coordinator' || this.currentRole === 'admin';
    },

    setupFilterListeners() {
        const inputs = ['filterCohort', 'filterFaculty', 'filterRoom', 'filterSearch'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.applyFilters());
                el.addEventListener('input', () => this.applyFilters());
            }
        });

        const btnAuditAll = document.getElementById('btnAuditFullTimetable');
        if (btnAuditAll) {
            btnAuditAll.addEventListener('click', () => this.runFullTimetableAudit());
        }
    },

    getFilterValues() {
        return {
            cohort_id: document.getElementById('filterCohort')?.value || '',
            faculty_id: document.getElementById('filterFaculty')?.value || '',
            room_id: document.getElementById('filterRoom')?.value || '',
            search: document.getElementById('filterSearch')?.value || ''
        };
    },

    async applyFilters() {
        const filters = this.getFilterValues();
        try {
            const res = await API.getTimetable(filters);
            this.sessions = res.data || [];
            TimetableGrid.setSessions(this.sessions);
        } catch (err) {
            console.error('Filter error:', err);
        }
    },

    async loadMetadata() {
        try {
            this.metadata = await API.getMetadata();
            this.populateSelectElements();
        } catch (err) {
            console.error('Failed to load metadata:', err);
        }
    },

    populateSelectElements() {
        // 1. Filter Cohort
        const filterCohort = document.getElementById('filterCohort');
        if (filterCohort) {
            filterCohort.innerHTML = '<option value="">All Cohorts / Batches</option>' +
                this.metadata.cohorts.map(c => `<option value="${c.id}">${c.code} (${c.student_count} students)</option>`).join('');
        }

        // 2. Filter Faculty
        const filterFaculty = document.getElementById('filterFaculty');
        if (filterFaculty) {
            filterFaculty.innerHTML = '<option value="">All Faculty Members</option>' +
                this.metadata.faculties.map(f => `<option value="${f.id}">${f.full_name} (${f.designation})</option>`).join('');
        }

        // 3. Filter Room
        const filterRoom = document.getElementById('filterRoom');
        if (filterRoom) {
            filterRoom.innerHTML = '<option value="">All Classrooms</option>' +
                this.metadata.rooms.map(r => `<option value="${r.id}">${r.room_number}</option>`).join('');
        }

        // 4. Modal Course Select
        const sessionCourse = document.getElementById('sessionCourse');
        if (sessionCourse) {
            sessionCourse.innerHTML = '<option value="">-- Select Course --</option>' +
                this.metadata.courses.map(c => `<option value="${c.id}">${c.course_code}: ${c.course_name}</option>`).join('');
        }

        // 5. Modal Faculty Select
        const sessionFaculty = document.getElementById('sessionFaculty');
        if (sessionFaculty) {
            sessionFaculty.innerHTML = '<option value="">-- Select Faculty Member --</option>' +
                this.metadata.faculties.map(f => `<option value="${f.id}">${f.full_name}</option>`).join('');
        }

        // 6. Modal Cohort Select
        const sessionCohort = document.getElementById('sessionCohort');
        if (sessionCohort) {
            sessionCohort.innerHTML = '<option value="">-- Select Cohort Batch --</option>' +
                this.metadata.cohorts.map(c => `<option value="${c.id}">${c.code} (${c.student_count} students)</option>`).join('');
        }

        // 7. Modal Room Select & Review Room Select
        const sessionRoom = document.getElementById('sessionRoom');
        const reviewTargetRoom = document.getElementById('reviewTargetRoom');
        const reqTargetRoom = document.getElementById('reqTargetRoom');
        const checkerRoom = document.getElementById('checkerRoomSelect');

        const roomOptions = '<option value="">-- Select Classroom --</option>' +
            this.metadata.rooms.map(r => `<option value="${r.id}">${r.room_number} (Cap: ${r.capacity})</option>`).join('');

        if (sessionRoom) sessionRoom.innerHTML = roomOptions;
        if (reviewTargetRoom) reviewTargetRoom.innerHTML = roomOptions;
        if (reqTargetRoom) reqTargetRoom.innerHTML = '<option value="">Auto-Assign Optimal Free Room</option>' +
            this.metadata.rooms.map(r => `<option value="${r.id}">${r.room_number} (Cap: ${r.capacity})</option>`).join('');
        if (checkerRoom) checkerRoom.innerHTML = '<option value="">All Classrooms</option>' +
            this.metadata.rooms.map(r => `<option value="${r.id}">${r.room_number}</option>`).join('');
    },

    async refreshAllData() {
        try {
            const [sessionsRes, requestsRes, noticesRes, metricsRes, auditRes] = await Promise.all([
                API.getTimetable(this.getFilterValues()),
                API.getChangeRequests(),
                API.getNotices(),
                API.getMetrics(),
                API.getAuditLogs()
            ]);

            this.sessions = sessionsRes.data || [];
            this.changeRequests = requestsRes.data || [];
            this.notices = noticesRes.data || [];
            this.metrics = metricsRes.data || {};
            this.auditLogs = auditRes.data || [];

            // Update sub-module views
            TimetableGrid.setSessions(this.sessions);
            ChangeRequests.setRequests(this.changeRequests);
            NoticeTicker.setNotices(this.notices);

            // Populate Change Request Session dropdown
            const reqSessionSelect = document.getElementById('reqSessionSelect');
            if (reqSessionSelect) {
                reqSessionSelect.innerHTML = '<option value="">-- Select Session to Relocate --</option>' +
                    this.sessions.map(s => `
                        <option value="${s.id}">
                            ${s.course ? s.course.course_code : ''} | ${s.day_of_week} ${s.start_time}-${s.end_time} | ${s.room ? s.room.room_number.split(' ')[0] : ''}
                        </option>
                    `).join('');
            }

            this.updateMetricsUI();

            // Update badge on requests nav tab
            const pendingCount = this.changeRequests.filter(r => r.status === 'PENDING_REVIEW').length;
            const badgeEl = document.getElementById('pendingRequestsTabBadge');
            if (badgeEl) {
                badgeEl.textContent = pendingCount;
                badgeEl.style.display = pendingCount > 0 ? 'inline-block' : 'none';
            }
        } catch (err) {
            console.error('Failed to refresh data:', err);
        }
    },

    updateMetricsUI() {
        const m = this.metrics;

        const valClashes = document.getElementById('metricClashes');
        const cardClashes = document.getElementById('cardMetricClashes');
        if (valClashes) {
            const count = m.activeClashesCount || 0;
            valClashes.textContent = count;
            if (count > 0) {
                cardClashes.className = 'metric-card alert';
                valClashes.style.color = 'var(--crimson-600)';
            } else {
                cardClashes.className = 'metric-card success';
                valClashes.style.color = 'var(--emerald-600)';
            }
        }

        const valPending = document.getElementById('metricPendingRequests');
        if (valPending) valPending.textContent = m.pendingRequestsCount || 0;

        const valRelocated = document.getElementById('metricRelocatedToday');
        if (valRelocated) valRelocated.textContent = m.relocatedSessionsCount || 0;

        const valUtil = document.getElementById('metricRoomUtilization');
        if (valUtil) valUtil.textContent = `${m.utilizationRate || 0}%`;

        const valNotices = document.getElementById('metricActiveNotices');
        if (valNotices) valNotices.textContent = m.activeNoticesCount || 0;
    },

    renderRoomsDirectory() {
        const container = document.getElementById('roomsDirectoryContainer');
        if (!container) return;

        let html = '<div class="rooms-grid">';
        for (const room of this.metadata.rooms) {
            html += `
                <div class="room-card">
                    <div class="room-card-header">
                        <div>
                            <div class="room-title">${room.room_number}</div>
                            <div class="room-building">${room.building} • Floor ${room.floor}</div>
                        </div>
                        <span class="room-capacity-badge">👥 ${room.capacity} seats</span>
                    </div>

                    <div style="font-size: 12px; color: var(--text-secondary);">
                        Type: <strong>${room.room_type}</strong>
                    </div>

                    <div class="room-facility-tags">
                        <span class="facility-tag ${room.has_projector ? 'active' : ''}">
                            ${room.has_projector ? '✓ AV Projector' : '✗ No Projector'}
                        </span>
                        <span class="facility-tag ${room.has_audio ? 'active' : ''}">
                            ${room.has_audio ? '✓ Mic / Sound' : '✗ No Audio'}
                        </span>
                        <span class="facility-tag ${room.has_ac ? 'active' : ''}">
                            ${room.has_ac ? '✓ AC Cooling' : '✗ Ventilation'}
                        </span>
                    </div>

                    <div style="margin-top: auto; padding-top: 8px; border-top: 1px solid var(--paper-border); display: flex; justify-content: space-between; align-items: center;">
                        <span class="facility-tag active" style="font-size: 11px;">Active & Functional</span>
                        <button class="btn btn-outline btn-sm" onclick="App.checkAvailabilityForRoom('${room.id}')">
                            Check Schedule
                        </button>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        container.innerHTML = html;
    },

    setupLiveRoomChecker() {
        const btnCheck = document.getElementById('btnRunRoomCheck');
        if (btnCheck) {
            btnCheck.addEventListener('click', async () => {
                const day = document.getElementById('checkerDay').value;
                const start = document.getElementById('checkerStart').value;
                const end = document.getElementById('checkerEnd').value;
                const capacity = document.getElementById('checkerCapacity').value;

                if (!day || !start || !end) {
                    this.showToast('Please specify day and time interval.', 'error');
                    return;
                }

                try {
                    const res = await API.getAvailableRooms(day, start, end, { min_capacity: capacity });
                    const container = document.getElementById('checkerResultsContainer');

                    let html = `
                        <div style="margin-top: 16px; background-color: var(--paper-subtle); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--paper-border);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <strong>Availability on ${day} (${start} - ${end}):</strong>
                                <span style="font-size: 12px; color: var(--cobalt-800);">
                                    <strong>${res.data.availableCount}</strong> Free / <strong>${res.data.occupiedCount}</strong> Occupied
                                </span>
                            </div>
                            <div class="alternate-rooms-grid">
                    `;

                    for (const r of res.data.allRoomStatuses) {
                        const isFree = r.is_available;
                        html += `
                            <div class="alt-room-card" style="border-left: 4px solid ${isFree ? 'var(--emerald-600)' : 'var(--crimson-600)'};">
                                <div>
                                    <div class="alt-room-name">${r.room_number}</div>
                                    <div class="alt-room-capacity">Cap: ${r.capacity} seats</div>
                                </div>
                                <span class="facility-tag ${isFree ? 'active' : ''}">
                                    ${isFree ? 'FREE' : 'OCCUPIED'}
                                </span>
                            </div>
                        `;
                    }

                    html += `
                            </div>
                        </div>
                    `;
                    container.innerHTML = html;
                } catch (err) {
                    this.showToast(err.message || 'Availability check failed.', 'error');
                }
            });
        }
    },

    checkAvailabilityForRoom(roomId) {
        this.switchTab('planner');
        document.getElementById('filterRoom').value = roomId;
        this.applyFilters();
    },

    renderAuditTimeline() {
        const container = document.getElementById('auditTimelineContainer');
        if (!container) return;

        if (!this.auditLogs.length) {
            container.innerHTML = `
                <div class="empty-placeholder">
                    <div class="empty-icon">📜</div>
                    <div class="empty-title">Audit Trail Empty</div>
                    <div class="empty-text">No timetable modifications or room change events logged yet.</div>
                </div>
            `;
            return;
        }

        let html = '<div class="audit-timeline">';
        for (const log of this.auditLogs) {
            html += `
                <div class="audit-entry">
                    <div class="audit-dot"></div>
                    <div class="audit-card">
                        <div class="audit-header">
                            <span class="audit-action">${log.action_type.replace('_', ' ')}</span>
                            <span class="audit-time">${new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <div class="audit-details">${log.details}</div>
                        <div class="audit-performer">Recorded by: ${log.performed_by_name} (${log.performed_by_role})</div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        container.innerHTML = html;
    },

    async runFullTimetableAudit() {
        try {
            this.showToast('Scanning full academic calendar for collisions...', 'info');
            const res = await API.auditAllClashes();

            if (res.totalClashes === 0) {
                alert('Audit Complete: 0 Timetable Clashes Found!\n\nAll classroom assignments, faculty schedules, and student batches are 100% conflict-free.');
            } else {
                let msg = `⚠️ Audit Alert: Found ${res.totalClashes} Timetable Clashes!\n\n`;
                res.clashes.forEach((c, idx) => {
                    msg += `${idx + 1}. [${c.type} Overlap]: Session "${c.session1.course?.course_code}" collides with "${c.session2.course?.course_code}" on ${c.session1.day_of_week} at ${c.session1.start_time}.\n`;
                });
                alert(msg);
            }
        } catch (err) {
            this.showToast('Audit failed: ' + err.message, 'error');
        }
    },

    async resetDemoData() {
        if (!confirm('Reset entire timetable, change requests, and notices to synthetic seed baseline?')) return;

        try {
            await API.resetDemoData();
            this.showToast('Demo data re-seeded successfully.', 'success');
            await this.refreshAllData();
        } catch (err) {
            this.showToast(err.message || 'Reset failed.', 'error');
        }
    },

    async checkDatabaseStatus() {
        try {
            const status = await API.getSystemStatus();
            const badge = document.getElementById('dbStatusBadge');
            if (badge) {
                if (status.mode === 'SUPABASE_POSTGRESQL') {
                    badge.innerHTML = `<span class="status-dot pulse" style="background-color: var(--emerald-600);"></span> Supabase PostgreSQL Connected`;
                } else {
                    badge.innerHTML = `<span class="status-dot" style="background-color: var(--amber-600);"></span> Local Resilient Store`;
                    badge.title = 'Running on built-in resilient state store. To sync with cloud Supabase PostgreSQL, add SUPABASE_URL and SUPABASE_KEY to .env';
                }
            }
        } catch (err) {
            console.warn('Status check warning:', err);
        }
    },

    // Session Modal Handlers
    openSessionDetails(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return;

        if (this.canEditTimetable()) {
            ClashModal.openEdit(session);
        } else if (this.currentRole === 'faculty') {
            // Open last-minute change request modal for this session
            ChangeRequests.openSubmitModal(sessionId);
        } else {
            // Student / Visitor detail popup
            alert(`Class Details:\n\nCourse: ${session.course?.course_code} - ${session.course?.course_name}\nFaculty: ${session.faculty?.full_name}\nCohort: ${session.cohort?.code}\nClassroom: ${session.room?.room_number}\nDay: ${session.day_of_week} (${session.start_time} - ${session.end_time})\nStatus: ${session.status}\nNotes: ${session.notes || 'None'}`);
        }
    },

    openNewSessionModal(day, time) {
        if (!this.canEditTimetable()) {
            this.showToast('Scheduling new sessions requires Academic Coordinator or Admin role.', 'warning');
            return;
        }
        ClashModal.openNew(day, time);
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : 'ℹ';
        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

window.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
