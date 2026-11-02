"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const response_1 = require("../shared/utils/response");
function errorHandler(err, _req, res, _next) {
    console.error('[Unhandled Error]:', err);
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'An unexpected internal error occurred';
    const code = err.code || 'INTERNAL_SERVER_ERROR';
    (0, response_1.sendError)(res, code, message, statusCode);
}
