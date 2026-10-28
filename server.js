const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./src/config/env');
const { attachUserContext } = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/errorHandler');

// Route Imports
const timetableRoutes = require('./src/routes/timetableRoutes');
const clashRoutes = require('./src/routes/clashRoutes');
const roomRoutes = require('./src/routes/roomRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const noticeRoutes = require('./src/routes/noticeRoutes');
const auditRoutes = require('./src/routes/auditRoutes');
const csvRoutes = require('./src/routes/csvRoutes');
const metaRoutes = require('./src/routes/metaRoutes');
const systemRoutes = require('./src/routes/systemRoutes');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(attachUserContext);

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        service: 'Timetable Clash and Last-Minute Classroom Change Coordinator API',
        status: 'HEALTHY',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/timetable', timetableRoutes);
app.use('/api/clash-detect', clashRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/change-requests', requestRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/system', systemRoutes);

// Catch-all for SPA client routing
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.url.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ success: false, error: 'Endpoint not found' });
    }
    next();
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server if invoked directly
if (require.main === module) {
    const server = app.listen(env.PORT, () => {
        console.log(`================================================================`);
        console.log(`  ChronoCampus: Timetable Clash & Room Change Coordinator`);
        console.log(`  Running on: http://localhost:${env.PORT}`);
        console.log(`  Mode: ${env.NODE_ENV} | DB Mode: ${env.DB_MODE}`);
        console.log(`================================================================`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${env.PORT} is already in use.`);
        } else {
            console.error('Server error:', err);
        }
    });
}

module.exports = app;
