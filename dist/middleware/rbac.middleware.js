"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = authorizeRoles;
const roles_1 = require("../shared/constants/roles");
const response_1 = require("../shared/utils/response");
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
            return;
        }
        const userRole = req.user.role;
        // Check if role is directly in allowed list
        let isAllowed = allowedRoles.includes(userRole);
        // If allowedRoles includes ADMIN or OWNER, treat both as authorized administrators
        if (!isAllowed) {
            const allowsAdmin = allowedRoles.some((r) => r === roles_1.UserRole.ADMIN || r === roles_1.UserRole.OWNER);
            if (allowsAdmin && (0, roles_1.isAdminRole)(userRole)) {
                isAllowed = true;
            }
        }
        if (!isAllowed) {
            (0, response_1.sendError)(res, 'FORBIDDEN', `Role '${userRole}' is not authorized to access this resource`, 403);
            return;
        }
        next();
    };
}
