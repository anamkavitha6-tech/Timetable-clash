// Role Hierarchy & Permission Middleware
// Roles: 'visitor' | 'faculty' | 'coordinator' | 'admin'

const ROLE_RANKS = {
    visitor: 1,
    faculty: 2,
    coordinator: 3,
    admin: 4
};

function attachUserContext(req, res, next) {
    const rawRole = (req.headers['x-user-role'] || req.query.role || 'visitor').toLowerCase().trim();
    const rawName = req.headers['x-user-name'] || req.query.userName || (rawRole === 'admin' ? 'System Admin' : rawRole === 'coordinator' ? 'Dr. Patricia Ward' : rawRole === 'faculty' ? 'Prof. David Miller' : 'Student Guest');

    const validRoles = ['visitor', 'faculty', 'coordinator', 'admin'];
    const role = validRoles.includes(rawRole) ? rawRole : 'visitor';

    req.user = {
        role,
        name: rawName,
        rank: ROLE_RANKS[role] || 1,
        isVisitor: role === 'visitor',
        isFaculty: role === 'faculty',
        isCoordinator: role === 'coordinator' || role === 'admin',
        isAdmin: role === 'admin'
    };

    next();
}

/**
 * Require a minimum role rank or specific allowed roles.
 */
function requireRole(allowedRoles = []) {
    return (req, res, next) => {
        const user = req.user || { role: 'visitor', rank: 1 };

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                error: 'FORBIDDEN',
                message: `Access denied. Action requires one of: [${allowedRoles.join(', ')}]. Current role: "${user.role}".`
            });
        }

        next();
    };
}

module.exports = {
    attachUserContext,
    requireRole,
    ROLE_RANKS
};
