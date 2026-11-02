"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const response_1 = require("../shared/utils/response");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication token missing or invalid', 401);
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
        req.user = decoded;
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
