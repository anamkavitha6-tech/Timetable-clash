// =========================================================================
// CHRONOCAMPUS - CSV Import / Export Manager
// =========================================================================

const CSVManager = {
    init() {
        const fileInput = document.getElementById('csvFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        document.getElementById('csvTextInput').value = event.target.result;
                        this.validatePreflight();
                    };
                    reader.readAsText(file);
                }
            });
        }
    },

    openModal() {
        document.getElementById('csvImportModalOverlay').classList.add('open');
        document.getElementById('csvPreflightResult').innerHTML = '';
        document.getElementById('csvTextInput').value = '';
    },

    closeModal() {
        document.getElementById('csvImportModalOverlay').classList.remove('open');
    },

    exportTimetable() {
        const filters = window.App ? window.App.getFilterValues() : {};
        const params = new URLSearchParams();
        if (filters.day) params.append('day', filters.day);
        if (filters.cohort_id) params.append('cohort_id', filters.cohort_id);
        if (filters.faculty_id) params.append('faculty_id', filters.faculty_id);
        if (filters.room_id) params.append('room_id', filters.room_id);

        window.open(`/api/csv/export?${params.toString()}`, '_blank');
        window.App.showToast('Generating timetable CSV export...', 'info');
    },

    downloadTemplate() {
        window.open('/api/csv/template', '_blank');
    },

    async validatePreflight() {
        const text = document.getElementById('csvTextInput').value;
        const container = document.getElementById('csvPreflightResult');

        if (!text || text.trim().length === 0) {
            window.App.showToast('Please paste CSV text or select a .csv file first.', 'warning');
            return;
        }

        container.innerHTML = `
            <div style="font-size: 12px; color: var(--cobalt-700); padding: 8px 0;">
                <span class="status-dot pulse" style="background-color: var(--cobalt-600); display: inline-block;"></span>
                Analyzing rows for room, faculty, and cohort overlaps...
            </div>
        `;

        try {
            const res = await API.importCSV(text, true); // dryRun = true

            let html = `
                <div style="margin-top: 10px; padding: 12px; border-radius: var(--radius-sm); background-color: var(--paper-subtle); border: 1px solid var(--paper-border);">
                    <div style="font-weight: 700; font-size: 13px; color: var(--cobalt-900); margin-bottom: 6px;">
                        Pre-Flight Conflict Analysis
                    </div>
                    <div style="display: flex; gap: 16px; font-size: 12.5px; margin-bottom: 8px;">
                        <span style="color: var(--emerald-700);"><strong>✅ Valid Rows:</strong> ${res.importedCount}</span>
                        <span style="color: ${res.failedCount > 0 ? 'var(--crimson-600)' : 'var(--text-muted)'};">
                            <strong>❌ Conflicting/Invalid:</strong> ${res.failedCount}
                        </span>
                    </div>
            `;

            if (res.failedRows && res.failedRows.length > 0) {
                html += `
                    <div style="max-height: 150px; overflow-y: auto; font-size: 11.5px; color: #991b1b; background: #fff5f5; padding: 8px; border-radius: 4px; border: 1px solid #fed7d7;">
                        ${res.failedRows.map(f => `<div>Row ${f.row}: ${f.error}</div>`).join('')}
                    </div>
                `;
            }

            html += '</div>';
            container.innerHTML = html;

            document.getElementById('btnCommitCsvImport').disabled = (res.importedCount === 0);
        } catch (err) {
            container.innerHTML = `
                <div class="clash-alert-box" style="margin-top: 10px;">
                    <div class="clash-alert-title">CSV Parsing Error</div>
                    <div style="font-size: 12px; color: #7f1d1d;">${err.message}</div>
                </div>
            `;
            document.getElementById('btnCommitCsvImport').disabled = true;
        }
    },

    async commitImport() {
        const text = document.getElementById('csvTextInput').value;

        if (!text || text.trim().length === 0) {
            window.App.showToast('No CSV content to import.', 'error');
            return;
        }

        try {
            const res = await API.importCSV(text, false); // dryRun = false
            window.App.showToast(`Import completed! ${res.importedCount} sessions added to database.`, 'success');
            this.closeModal();
            window.App.refreshAllData();
        } catch (err) {
            window.App.showToast(err.message || 'Import failed.', 'error');
        }
    }
};

window.CSVManager = CSVManager;
