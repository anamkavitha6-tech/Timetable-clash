const { supabase, isConnected } = require('../config/supabase');
const { getInitialData } = require('./seedData');
const crypto = require('crypto');

// In-memory relational store fallback initialized with seed data
let memoryStore = getInitialData();

function generateUUID() {
    return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

// Helper to enrich timetable sessions with relational object details
function enrichSession(session, store) {
    if (!session) return null;
    const course = store.courses.find(c => c.id === session.course_id) || { course_code: 'Unknown', course_name: 'Unknown Course' };
    const faculty = store.faculties.find(f => f.id === session.faculty_id) || { full_name: 'Unassigned', email: '' };
    const cohort = store.cohorts.find(ch => ch.id === session.cohort_id) || { code: 'Unknown Batch', student_count: 0 };
    const room = store.rooms.find(r => r.id === session.room_id) || { room_number: 'Unassigned Room', capacity: 0, building: '' };

    return {
        ...session,
        course,
        faculty,
        cohort,
        room
    };
}

// Helper to enrich change requests
function enrichRequest(request, store) {
    if (!request) return null;
    const session = store.timetableSessions.find(s => s.id === request.session_id);
    const enrichedSession = session ? enrichSession(session, store) : null;
    const originalRoom = store.rooms.find(r => r.id === request.original_room_id) || null;
    const targetRoom = store.rooms.find(r => r.id === request.target_room_id) || null;

    return {
        ...request,
        session: enrichedSession,
        original_room: originalRoom,
        target_room: targetRoom
    };
}

const db = {
    // -------------------------------------------------------------
    // System & Health
    // -------------------------------------------------------------
    async isHealthy() {
        if (isConnected() && supabase) {
            try {
                const { error } = await supabase.from('rooms').select('id').limit(1);
                return !error;
            } catch (err) {
                return false;
            }
        }
        return true;
    },

    getStoreMode() {
        return isConnected() ? 'supabase' : 'resilient-in-memory';
    },

    async resetDemoData() {
        if (isConnected() && supabase) {
            // Can be reset via seed.sql or API
        }
        memoryStore = getInitialData();
        return { success: true, message: 'Synthetic dataset re-initialized successfully.' };
    },

    // -------------------------------------------------------------
    // Metadata (Departments, Rooms, Faculties, Cohorts, Courses)
    // -------------------------------------------------------------
    async getDepartments() {
        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('departments').select('*').order('name');
            if (!error && data) return data;
        }
        return [...memoryStore.departments];
    },

    async getRooms() {
        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('rooms').select('*').order('room_number');
            if (!error && data) return data;
        }
        return [...memoryStore.rooms];
    },

    async getRoomById(id) {
        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('rooms').select('*').eq('id', id).single();
            if (!error && data) return data;
        }
        return memoryStore.rooms.find(r => r.id === id) || null;
    },

    async getFaculties() {
        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('faculties').select('*').order('full_name');
            if (!error && data) return data;
        }
        return [...memoryStore.faculties];
    },

    async getCohorts() {
        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('cohorts').select('*').order('code');
            if (!error && data) return data;
        }
        return [...memoryStore.cohorts];
    },

    async getCourses() {
        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('courses').select('*').order('course_code');
            if (!error && data) return data;
        }
        return [...memoryStore.courses];
    },

    // -------------------------------------------------------------
    // Timetable Sessions
    // -------------------------------------------------------------
    async getSessions(filters = {}) {
        if (isConnected() && supabase) {
            let query = supabase.from('timetable_sessions').select(`
                *,
                course:courses(*),
                faculty:faculties(*),
                cohort:cohorts(*),
                room:rooms(*)
            `);

            if (filters.day_of_week) query = query.eq('day_of_week', filters.day_of_week);
            if (filters.cohort_id) query = query.eq('cohort_id', filters.cohort_id);
            if (filters.faculty_id) query = query.eq('faculty_id', filters.faculty_id);
            if (filters.room_id) query = query.eq('room_id', filters.room_id);
            if (filters.status) query = query.eq('status', filters.status);

            const { data, error } = await query;
            if (!error && data) return data;
        }

        // Memory Store query
        let results = memoryStore.timetableSessions.map(s => enrichSession(s, memoryStore));

        if (filters.day_of_week) {
            results = results.filter(s => s.day_of_week === filters.day_of_week);
        }
        if (filters.cohort_id) {
            results = results.filter(s => s.cohort_id === filters.cohort_id);
        }
        if (filters.faculty_id) {
            results = results.filter(s => s.faculty_id === filters.faculty_id);
        }
        if (filters.room_id) {
            results = results.filter(s => s.room_id === filters.room_id);
        }
        if (filters.status) {
            results = results.filter(s => s.status === filters.status);
        }
        if (filters.search) {
            const q = filters.search.toLowerCase();
            results = results.filter(s =>
                (s.course && (s.course.course_code.toLowerCase().includes(q) || s.course.course_name.toLowerCase().includes(q))) ||
                (s.faculty && s.faculty.full_name.toLowerCase().includes(q)) ||
                (s.cohort && s.cohort.code.toLowerCase().includes(q)) ||
                (s.room && s.room.room_number.toLowerCase().includes(q)) ||
                (s.notes && s.notes.toLowerCase().includes(q))
            );
        }

        // Sort by day and start time
        const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
        results.sort((a, b) => {
            const dayDiff = (dayOrder[a.day_of_week] || 0) - (dayOrder[b.day_of_week] || 0);
            if (dayDiff !== 0) return dayDiff;
            return a.start_time.localeCompare(b.start_time);
        });

        return results;
    },

    async getSessionById(id) {
        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('timetable_sessions').select(`
                *,
                course:courses(*),
                faculty:faculties(*),
                cohort:cohorts(*),
                room:rooms(*)
            `).eq('id', id).single();
            if (!error && data) return data;
        }

        const session = memoryStore.timetableSessions.find(s => s.id === id);
        return session ? enrichSession(session, memoryStore) : null;
    },

    async createSession(sessionData) {
        const newRecord = {
            id: sessionData.id || generateUUID(),
            course_id: sessionData.course_id,
            faculty_id: sessionData.faculty_id,
            cohort_id: sessionData.cohort_id,
            room_id: sessionData.room_id,
            day_of_week: sessionData.day_of_week,
            start_time: sessionData.start_time,
            end_time: sessionData.end_time,
            session_type: sessionData.session_type || 'Lecture',
            status: sessionData.status || 'ACTIVE',
            notes: sessionData.notes || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('timetable_sessions').insert(newRecord).select().single();
            if (error) throw new Error(error.message);
            return data;
        }

        memoryStore.timetableSessions.push(newRecord);
        return enrichSession(newRecord, memoryStore);
    },

    async updateSession(id, updateData) {
        if (isConnected() && supabase) {
            const { data, error } = await supabase
                .from('timetable_sessions')
                .update({ ...updateData, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw new Error(error.message);
            return data;
        }

        const index = memoryStore.timetableSessions.findIndex(s => s.id === id);
        if (index === -1) return null;

        memoryStore.timetableSessions[index] = {
            ...memoryStore.timetableSessions[index],
            ...updateData,
            updated_at: new Date().toISOString()
        };

        return enrichSession(memoryStore.timetableSessions[index], memoryStore);
    },

    async deleteSession(id) {
        if (isConnected() && supabase) {
            const { error } = await supabase.from('timetable_sessions').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        }

        const initialLen = memoryStore.timetableSessions.length;
        memoryStore.timetableSessions = memoryStore.timetableSessions.filter(s => s.id !== id);
        return memoryStore.timetableSessions.length < initialLen;
    },

    // -------------------------------------------------------------
    // Change Requests
    // -------------------------------------------------------------
    async getChangeRequests(filters = {}) {
        if (isConnected() && supabase) {
            let query = supabase.from('change_requests').select(`
                *,
                session:timetable_sessions(
                    *,
                    course:courses(*),
                    faculty:faculties(*),
                    cohort:cohorts(*),
                    room:rooms(*)
                ),
                original_room:rooms!original_room_id(*),
                target_room:rooms!target_room_id(*)
            `).order('created_at', { ascending: false });

            if (filters.status) query = query.eq('status', filters.status);
            if (filters.urgency) query = query.eq('urgency', filters.urgency);

            const { data, error } = await query;
            if (!error && data) return data;
        }

        let results = memoryStore.changeRequests.map(r => enrichRequest(r, memoryStore));

        if (filters.status) {
            results = results.filter(r => r.status === filters.status);
        }
        if (filters.urgency) {
            results = results.filter(r => r.urgency === filters.urgency);
        }

        // Sort descending by created_at
        results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return results;
    },

    async getChangeRequestById(id) {
        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('change_requests').select('*').eq('id', id).single();
            if (!error && data) return data;
        }
        const req = memoryStore.changeRequests.find(r => r.id === id);
        return req ? enrichRequest(req, memoryStore) : null;
    },

    async createChangeRequest(data) {
        const newRecord = {
            id: data.id || generateUUID(),
            session_id: data.session_id,
            requested_by_name: data.requested_by_name || 'Faculty Member',
            requested_by_role: data.requested_by_role || 'Faculty',
            original_room_id: data.original_room_id,
            target_room_id: data.target_room_id || null,
            urgency: data.urgency || 'TODAY',
            reason_category: data.reason_category || 'EQUIPMENT_FAILURE',
            reason_details: data.reason_details,
            status: 'PENDING_REVIEW',
            reviewed_by: null,
            review_notes: null,
            reviewed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (isConnected() && supabase) {
            const { data: res, error } = await supabase.from('change_requests').insert(newRecord).select().single();
            if (error) throw new Error(error.message);
            return res;
        }

        memoryStore.changeRequests.unshift(newRecord);
        return enrichRequest(newRecord, memoryStore);
    },

    async updateChangeRequest(id, updateData) {
        if (isConnected() && supabase) {
            const { data, error } = await supabase
                .from('change_requests')
                .update({ ...updateData, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw new Error(error.message);
            return data;
        }

        const index = memoryStore.changeRequests.findIndex(r => r.id === id);
        if (index === -1) return null;

        memoryStore.changeRequests[index] = {
            ...memoryStore.changeRequests[index],
            ...updateData,
            updated_at: new Date().toISOString()
        };

        return enrichRequest(memoryStore.changeRequests[index], memoryStore);
    },

    // -------------------------------------------------------------
    // Audit Logs
    // -------------------------------------------------------------
    async getAuditLogs(limit = 50) {
        if (isConnected() && supabase) {
            const { data, error } = await supabase
                .from('change_audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            if (!error && data) return data;
        }

        return [...memoryStore.changeAuditLogs]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
    },

    async createAuditLog(logData) {
        const newRecord = {
            id: logData.id || generateUUID(),
            session_id: logData.session_id || null,
            change_request_id: logData.change_request_id || null,
            action_type: logData.action_type,
            details: logData.details,
            previous_state: logData.previous_state || null,
            new_state: logData.new_state || null,
            performed_by_role: logData.performed_by_role || 'Academic Coordinator',
            performed_by_name: logData.performed_by_name || 'System Operator',
            created_at: new Date().toISOString()
        };

        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('change_audit_logs').insert(newRecord).select().single();
            if (error) throw new Error(error.message);
            return data;
        }

        memoryStore.changeAuditLogs.unshift(newRecord);
        return newRecord;
    },

    // -------------------------------------------------------------
    // In-App Notices
    // -------------------------------------------------------------
    async getNotices(filters = {}) {
        if (isConnected() && supabase) {
            let query = supabase.from('in_app_notices').select('*').order('created_at', { ascending: false });
            if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
            const { data, error } = await query;
            if (!error && data) return data;
        }

        let results = [...memoryStore.inAppNotices];
        if (filters.is_active !== undefined) {
            results = results.filter(n => n.is_active === filters.is_active);
        }

        results.sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        return results;
    },

    async createNotice(noticeData) {
        const newRecord = {
            id: noticeData.id || generateUUID(),
            title: noticeData.title,
            message: noticeData.message,
            urgency: noticeData.urgency || 'INFO',
            session_id: noticeData.session_id || null,
            cohort_id: noticeData.cohort_id || null,
            room_id: noticeData.room_id || null,
            is_pinned: noticeData.is_pinned !== undefined ? noticeData.is_pinned : true,
            is_active: true,
            created_at: new Date().toISOString()
        };

        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('in_app_notices').insert(newRecord).select().single();
            if (error) throw new Error(error.message);
            return data;
        }

        memoryStore.inAppNotices.unshift(newRecord);
        return newRecord;
    },

    async dismissNotice(id) {
        if (isConnected() && supabase) {
            const { data, error } = await supabase.from('in_app_notices').update({ is_active: false }).eq('id', id).select().single();
            if (error) throw new Error(error.message);
            return data;
        }

        const notice = memoryStore.inAppNotices.find(n => n.id === id);
        if (notice) notice.is_active = false;
        return notice;
    },

    // -------------------------------------------------------------
    // System Metrics & Analytics
    // -------------------------------------------------------------
    async getSystemMetrics() {
        const sessions = await this.getSessions();
        const requests = await this.getChangeRequests();
        const rooms = await this.getRooms();
        const notices = await this.getNotices({ is_active: true });

        const pendingRequests = requests.filter(r => r.status === 'PENDING_REVIEW');
        const approvedToday = requests.filter(r => r.status === 'APPROVED');
        const activeSessions = sessions.filter(s => s.status !== 'CANCELLED');
        const relocatedSessions = sessions.filter(s => s.status === 'RELOCATED');

        // Calculate room utilization (% of available 8-hour daily room slots booked)
        // Assume 8 slots/day * 5 days = 40 possible session hours per room per week
        const totalCapacitySlots = rooms.length * 40;
        const totalBookedSlots = activeSessions.length;
        const utilizationRate = totalCapacitySlots > 0
            ? Math.min(100, Math.round((totalBookedSlots / totalCapacitySlots) * 100))
            : 0;

        return {
            totalSessions: sessions.length,
            activeSessions: activeSessions.length,
            relocatedSessionsCount: relocatedSessions.length,
            pendingRequestsCount: pendingRequests.length,
            approvedTodayCount: approvedToday.length,
            totalRooms: rooms.length,
            activeNoticesCount: notices.length,
            utilizationRate: utilizationRate,
            activeClashesCount: 0 // Will be evaluated dynamically by clashDetector
        };
    }
};

module.exports = db;
