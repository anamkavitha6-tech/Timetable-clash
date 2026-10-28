// =========================================================================
// CHRONOCAMPUS - In-App Notices & Live Relocation Ticker
// =========================================================================

const NoticeTicker = {
    notices: [],
    currentIndex: 0,
    tickerInterval: null,

    init() {
        // Ticker rotation interval every 6 seconds
        this.tickerInterval = setInterval(() => {
            this.rotateTicker();
        }, 6000);

        const form = document.getElementById('newNoticeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.broadcastNewNotice();
            });
        }
    },

    setNotices(notices) {
        this.notices = notices || [];
        this.renderTicker();
        this.renderNoticesDrawer();
    },

    renderTicker() {
        const textEl = document.getElementById('tickerText');
        const badgeEl = document.getElementById('tickerBadge');
        if (!textEl || !badgeEl) return;

        if (!this.notices.length) {
            badgeEl.textContent = 'ONLINE';
            badgeEl.style.backgroundColor = 'var(--emerald-600)';
            textEl.textContent = 'All academic timetables normal. No active room relocations reported.';
            return;
        }

        const notice = this.notices[this.currentIndex % this.notices.length];

        badgeEl.textContent = notice.urgency;
        if (notice.urgency === 'CRITICAL') {
            badgeEl.style.backgroundColor = 'var(--crimson-600)';
        } else if (notice.urgency === 'WARNING') {
            badgeEl.style.backgroundColor = 'var(--amber-600)';
        } else {
            badgeEl.style.backgroundColor = 'var(--cobalt-600)';
        }

        textEl.textContent = `${notice.title} — ${notice.message}`;
    },

    rotateTicker() {
        if (this.notices.length <= 1) return;
        this.currentIndex = (this.currentIndex + 1) % this.notices.length;

        const textEl = document.getElementById('tickerText');
        if (textEl) {
            textEl.style.opacity = '0';
            setTimeout(() => {
                this.renderTicker();
                textEl.style.opacity = '1';
            }, 200);
        }
    },

    renderNoticesDrawer() {
        const container = document.getElementById('noticesListContainer');
        if (!container) return;

        if (!this.notices.length) {
            container.innerHTML = `
                <div class="empty-placeholder">
                    <div class="empty-icon">📢</div>
                    <div class="empty-title">Notice Board Clear</div>
                    <div class="empty-text">There are currently no active campus alerts or classroom relocations.</div>
                </div>
            `;
            return;
        }

        const isCoordinator = window.App ? window.App.canPublishNotices() : true;

        let html = '';
        for (const n of this.notices) {
            const urgencyClass = `urgency-${(n.urgency || 'info').toLowerCase()}`;

            html += `
                <div class="notice-card ${urgencyClass}">
                    <div class="notice-card-header">
                        <span class="notice-title">${n.title}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="urgency-badge ${(n.urgency || 'info').toLowerCase()}">${n.urgency}</span>
                            ${isCoordinator ? `
                                <button class="btn btn-outline btn-sm" style="padding: 2px 6px; font-size: 10px;" onclick="NoticeTicker.dismissNotice('${n.id}')">
                                    Dismiss
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="notice-msg">${n.message}</div>
                    <div class="notice-meta">
                        <span>🕒 Posted: ${new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ${n.is_pinned ? '<span>📌 Pinned to Ticker</span>' : ''}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    openNoticeBoard() {
        document.getElementById('noticesModalOverlay').classList.add('open');
    },

    closeNoticeBoard() {
        document.getElementById('noticesModalOverlay').classList.remove('open');
    },

    async broadcastNewNotice() {
        const title = document.getElementById('noticeTitle').value;
        const message = document.getElementById('noticeMessage').value;
        const urgency = document.getElementById('noticeUrgency').value;

        if (!title || !message) {
            window.App.showToast('Please enter both title and message.', 'error');
            return;
        }

        try {
            await API.createNotice({ title, message, urgency, is_pinned: true });
            window.App.showToast('Campus notice broadcast successfully.', 'success');
            document.getElementById('newNoticeForm').reset();
            window.App.refreshAllData();
        } catch (err) {
            window.App.showToast(err.message || 'Failed to post notice.', 'error');
        }
    },

    async dismissNotice(id) {
        try {
            await API.dismissNotice(id);
            window.App.showToast('Notice dismissed.', 'info');
            window.App.refreshAllData();
        } catch (err) {
            window.App.showToast(err.message || 'Error dismissing notice.', 'error');
        }
    }
};

window.NoticeTicker = NoticeTicker;
