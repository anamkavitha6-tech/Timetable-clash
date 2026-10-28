// =========================================================================
// CHRONOCAMPUS - Frontend API Client
// Handles REST communication, active role headers, and error handling
// =========================================================================

const API = {
    // Current user context (synced from app state)
    currentUser: {
        role: 'coordinator', // default active role for evaluator
        name: 'Dr. Patricia Ward'
    },

    setRole(role, name) {
        this.currentUser.role = role;
        if (name) this.currentUser.name = name;
        localStorage.setItem('chronocampus_role', role);
        localStorage.setItem('chronocampus_user_name', this.currentUser.name);
    },

    getHeaders(extraHeaders = {}) {
        return {
            'Content-Type': 'application/json',
            'x-user-role': this.currentUser.role,
            'x-user-name': this.currentUser.name,
            ...extraHeaders
        };
    },

    async request(url, options = {}) {
        options.headers = this.getHeaders(options.headers);

        try {
            const res = await fetch(url, options);
            const data = await res.json().catch(() => ({ success: false, error: 'INVALID_JSON' }));

            if (!res.ok) {
                const err = new Error(data.message || data.error || 'Server error occurred');
                err.status = res.status;
                err.data = data;
                throw err;
            }

            return data;
        } catch (err) {
            console.error(`[API Call Error] ${url}:`, err);
            throw err;
        }
    },

    // --- Timetable API ---
    async getTimetable(filters = {}) {
        const params = new URLSearchParams();
        if (filters.day) params.append('day', filters.day);
        if (filters.cohort_id) params.append('cohort_id', filters.cohort_id);
        if (filters.faculty_id) params.append('faculty_id', filters.faculty_id);
        if (filters.room_id) params.append('room_id', filters.room_id);
        if (filters.search) params.append('search', filters.search);

        const url = `/api/timetable${params.toString() ? '?' + params.toString() : ''}`;
        return this.request(url);
    },

    async createSession(sessionData, force = false) {
        const url = `/api/timetable${force ? '?force=true' : ''}`;
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    },

    async updateSession(id, sessionData, force = false) {
        const url = `/api/timetable/${id}${force ? '?force=true' : ''}`;
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(sessionData)
        });
    },

    async deleteSession(id) {
        return this.request(`/api/timetable/${id}`, {
            method: 'DELETE'
        });
    },

    // --- Conflict Detection ---
    async detectClash(payload) {
        return this.request('/api/clash-detect', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    async auditAllClashes() {
        return this.request('/api/clash-detect/audit-all');
    },

    // --- Rooms & Availability ---
    async getRooms() {
        return this.request('/api/rooms');
    },

    async getAvailableRooms(day, start, end, options = {}) {
        const params = new URLSearchParams({ day, start, end });
        if (options.min_capacity) params.append('min_capacity', options.min_capacity);
        if (options.room_type) params.append('room_type', options.room_type);
        if (options.projector) params.append('projector', 'true');

        return this.request(`/api/rooms/available?${params.toString()}`);
    },

    // --- Change Requests ---
    async getChangeRequests(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.urgency) params.append('urgency', filters.urgency);

        return this.request(`/api/change-requests${params.toString() ? '?' + params.toString() : ''}`);
    },

    async submitChangeRequest(data) {
        return this.request('/api/change-requests', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async reviewChangeRequest(id, { action, target_room_id, review_notes }) {
        return this.request(`/api/change-requests/${id}/review`, {
            method: 'POST',
            body: JSON.stringify({ action, target_room_id, review_notes })
        });
    },

    async quickRelocate(data) {
        return this.request('/api/change-requests/quick-relocate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // --- Notices & Broadcasts ---
    async getNotices() {
        return this.request('/api/notices');
    },

    async createNotice(data) {
        return this.request('/api/notices', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async dismissNotice(id) {
        return this.request(`/api/notices/${id}/dismiss`, {
            method: 'PATCH'
        });
    },

    // --- Audit Logs ---
    async getAuditLogs(limit = 40) {
        return this.request(`/api/audit-logs?limit=${limit}`);
    },

    // --- System & Metadata ---
    async getMetrics() {
        return this.request('/api/system/metrics');
    },

    async getSystemStatus() {
        return this.request('/api/system/status');
    },

    async resetDemoData() {
        return this.request('/api/system/reset-demo', {
            method: 'POST'
        });
    },

    async getMetadata() {
        const [departments, faculties, cohorts, courses, rooms] = await Promise.all([
            this.request('/api/meta/departments'),
            this.request('/api/meta/faculties'),
            this.request('/api/meta/cohorts'),
            this.request('/api/meta/courses'),
            this.request('/api/rooms')
        ]);

        return {
            departments: departments.data || [],
            faculties: faculties.data || [],
            cohorts: cohorts.data || [],
            courses: courses.data || [],
            rooms: rooms.data || []
        };
    },

    // --- CSV Operations ---
    async importCSV(csvText, dryRun = false) {
        return this.request(`/api/csv/import?dryRun=${dryRun ? 'true' : 'false'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: csvText
        });
    }
};

window.API = API;
