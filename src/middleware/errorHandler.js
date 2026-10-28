function errorHandler(err, req, res, next) {
    console.error(`[API Error] ${req.method} ${req.url}:`, err.message || err);

    const statusCode = err.statusCode || (err.message && err.message.includes('not found') ? 404 : 400);

    res.status(statusCode).json({
        success: false,
        error: err.name || 'API_ERROR',
        message: err.message || 'An unexpected error occurred.',
        details: err.details || null
    });
}

module.exports = errorHandler;
