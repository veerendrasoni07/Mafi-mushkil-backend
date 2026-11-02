"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middleware/error.middleware");
// Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const catalog_routes_1 = __importDefault(require("./modules/catalog/catalog.routes"));
const request_routes_1 = __importDefault(require("./modules/requests/request.routes"));
const engineer_routes_1 = __importDefault(require("./modules/engineers/engineer.routes"));
const complaint_routes_1 = __importDefault(require("./modules/complaints/complaint.routes"));
const notification_routes_1 = __importDefault(require("./modules/notifications/notification.routes"));
const promotion_routes_1 = __importDefault(require("./modules/promotions/promotion.routes"));
const support_routes_1 = __importDefault(require("./modules/support/support.routes"));
function createApp() {
    const app = (0, express_1.default)();
    // Security & Utility Middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: env_1.config.corsOrigin, credentials: true }));
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
    if (env_1.config.nodeEnv !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // Rate Limiting for public endpoints
    const apiLimiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 200, // Limit each IP to 200 requests per window
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } },
    });
    app.use('/api/', apiLimiter);
    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: new Date() });
    });
    // REST API v1
    app.use('/api/v1/auth', auth_routes_1.default);
    app.use('/api/v1/catalog', catalog_routes_1.default);
    app.use('/api/v1/requests', request_routes_1.default);
    app.use('/api/v1/engineers', engineer_routes_1.default);
    app.use('/api/v1/complaints', complaint_routes_1.default);
    app.use('/api/v1/notifications', notification_routes_1.default);
    app.use('/api/v1/promotions', promotion_routes_1.default);
    app.use('/api/v1/support', support_routes_1.default);
    // 404 handler
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'The requested API route was not found.' },
        });
    });
    // Centralized Error Handler
    app.use(error_middleware_1.errorHandler);
    return app;
}
