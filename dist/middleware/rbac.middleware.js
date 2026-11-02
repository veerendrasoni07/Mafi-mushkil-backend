"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = authorizeRoles;
const response_1 = require("../shared/utils/response");
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            (0, response_1.sendError)(res, 'FORBIDDEN', `Role '${req.user.role}' is not authorized to access this resource`, 403);
            return;
        }
        next();
    };
}
