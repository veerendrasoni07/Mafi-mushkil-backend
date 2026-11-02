"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requirePasswordChanged = requirePasswordChanged;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const roles_1 = require("../shared/constants/roles");
const response_1 = require("../shared/utils/response");
const user_model_1 = require("../modules/users/user.model");
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication token missing or invalid', 401);
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
        // Check account status in database to enforce immediate deactivation
        const dbUser = await user_model_1.UserModel.findById(decoded.id).select('isActive mustChangePassword role name email phone');
        if (!dbUser) {
            (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User account does not exist or has been removed', 401);
            return;
        }
        if (!dbUser.isActive) {
            (0, response_1.sendError)(res, 'ACCOUNT_DEACTIVATED', 'Your account has been deactivated. Please contact an administrator.', 403);
            return;
        }
        // Attach verified user info
        req.user = {
            id: dbUser._id.toString(),
            phone: dbUser.phone || decoded.phone,
            email: dbUser.email || decoded.email,
            role: dbUser.role,
            name: dbUser.name,
            mustChangePassword: dbUser.mustChangePassword,
        };
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            (0, response_1.sendError)(res, 'TOKEN_EXPIRED', 'Authentication token has expired', 401);
            return;
        }
        (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Invalid authentication token', 401);
    }
}
/**
 * Middleware that blocks engineers who have not completed their mandatory first-login password change.
 */
function requirePasswordChanged(req, res, next) {
    if (req.user && req.user.role === roles_1.UserRole.ENGINEER && req.user.mustChangePassword) {
        (0, response_1.sendError)(res, 'PASSWORD_CHANGE_REQUIRED', 'You must change your temporary password before accessing engineer tasks and resources.', 403);
        return;
    }
    next();
}
