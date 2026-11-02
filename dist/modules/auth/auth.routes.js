"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = require("./auth.controller");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Rate limiting for sensitive authentication endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 attempts per 15 min window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many authentication attempts. Please try again after 15 minutes.',
        },
    },
});
// Public Customer Registration (Always creates CUSTOMER role)
router.post('/register', authLimiter, (0, validate_middleware_1.validateBody)(auth_controller_1.RegisterCustomerSchema), auth_controller_1.AuthController.register);
// Common Unified Login for all roles
router.post('/login', authLimiter, (0, validate_middleware_1.validateBody)(auth_controller_1.LoginSchema), auth_controller_1.AuthController.login);
// Authenticated Password Change (First login or normal)
router.post('/change-password', auth_middleware_1.authenticate, (0, validate_middleware_1.validateBody)(auth_controller_1.ChangePasswordSchema), auth_controller_1.AuthController.changePassword);
// Password Recovery
router.post('/forgot-password', authLimiter, (0, validate_middleware_1.validateBody)(auth_controller_1.ForgotPasswordSchema), auth_controller_1.AuthController.forgotPassword);
router.post('/reset-password', authLimiter, (0, validate_middleware_1.validateBody)(auth_controller_1.ResetPasswordSchema), auth_controller_1.AuthController.resetPassword);
// User Session
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.AuthController.getMe);
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.AuthController.logout);
// Development / Demo Login
router.post('/demo-login', (0, validate_middleware_1.validateBody)(auth_controller_1.DemoLoginSchema), auth_controller_1.AuthController.demoLogin);
exports.default = router;
