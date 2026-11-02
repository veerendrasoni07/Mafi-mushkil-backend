"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = exports.VerifyOtpSchema = exports.RequestOtpSchema = exports.DemoLoginSchema = exports.ResetPasswordSchema = exports.ForgotPasswordSchema = exports.ChangePasswordSchema = exports.LoginSchema = exports.RegisterCustomerSchema = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("./auth.service");
const roles_1 = require("../../shared/constants/roles");
const response_1 = require("../../shared/utils/response");
exports.RegisterCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: zod_1.z.string().email('Valid email address is required').max(150),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').max(100),
    phone: zod_1.z.string().min(8, 'Phone number must be at least 8 digits').max(20).optional(),
    // Discard any role supplied by client — public registration is strictly CUSTOMER
    role: zod_1.z.any().optional(),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email address is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.ChangePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters').max(100),
});
exports.ForgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email address is required'),
});
exports.ResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(4, 'Reset token is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters').max(100),
});
exports.DemoLoginSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    phone: zod_1.z.string().min(8, 'Valid phone number is required').max(20),
    role: zod_1.z.nativeEnum(roles_1.UserRole),
});
exports.RequestOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().min(8, 'Valid phone number is required').max(20),
});
exports.VerifyOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().min(8, 'Valid phone number is required').max(20),
    otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
    name: zod_1.z.string().max(100).optional(),
});
class AuthController {
    /**
     * Public Customer Registration
     */
    static async register(req, res) {
        try {
            const { name, email, password, phone } = req.body;
            const result = await auth_service_1.AuthService.registerCustomer({ name, email, password, phone });
            (0, response_1.sendSuccess)(res, result, 'Customer account created successfully', 201);
        }
        catch (err) {
            if (err.message === 'EMAIL_ALREADY_EXISTS') {
                (0, response_1.sendError)(res, 'EMAIL_EXISTS', 'An account with this email address already exists.', 400);
                return;
            }
            (0, response_1.sendError)(res, 'REGISTRATION_FAILED', err.message || 'Registration failed', 400);
        }
    }
    /**
     * Common Centralized Login
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.AuthService.login({ email, password });
            (0, response_1.sendSuccess)(res, result, 'Login successful');
        }
        catch (err) {
            if (err.message === 'INVALID_CREDENTIALS') {
                (0, response_1.sendError)(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
                return;
            }
            if (err.message === 'ACCOUNT_DEACTIVATED') {
                (0, response_1.sendError)(res, 'ACCOUNT_DEACTIVATED', 'Your account has been deactivated. Please contact support or your administrator.', 403);
                return;
            }
            (0, response_1.sendError)(res, 'LOGIN_FAILED', err.message || 'Login failed', 400);
        }
    }
    /**
     * Change Password (Voluntary or First-Time Mandatory)
     */
    static async changePassword(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const { currentPassword, newPassword } = req.body;
            await auth_service_1.AuthService.changePassword(req.user.id, currentPassword, newPassword);
            (0, response_1.sendSuccess)(res, null, 'Password changed successfully');
        }
        catch (err) {
            if (err.message === 'INVALID_CURRENT_PASSWORD') {
                (0, response_1.sendError)(res, 'INVALID_PASSWORD', 'The current password you provided is incorrect.', 400);
                return;
            }
            (0, response_1.sendError)(res, 'PASSWORD_CHANGE_FAILED', err.message || 'Failed to change password', 400);
        }
    }
    /**
     * Forgot Password
     */
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const result = await auth_service_1.AuthService.forgotPassword(email);
            (0, response_1.sendSuccess)(res, {
                delivered: result.delivered,
                simulated: result.simulated || false,
            }, 'If an account exists with that email address, password reset instructions have been sent.');
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FORGOT_PASSWORD_FAILED', err.message || 'Request failed', 400);
        }
    }
    /**
     * Reset Password
     */
    static async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            await auth_service_1.AuthService.resetPassword(token, newPassword);
            (0, response_1.sendSuccess)(res, null, 'Your password has been reset successfully. You may now log in with your new password.');
        }
        catch (err) {
            if (err.message === 'INVALID_OR_EXPIRED_TOKEN') {
                (0, response_1.sendError)(res, 'INVALID_TOKEN', 'The reset token is invalid or has expired.', 400);
                return;
            }
            (0, response_1.sendError)(res, 'RESET_FAILED', err.message || 'Password reset failed', 400);
        }
    }
    /**
     * Get Current Authenticated Profile
     */
    static async getMe(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Not authenticated', 401);
                return;
            }
            const user = await auth_service_1.AuthService.getCurrentUser(req.user.id);
            if (!user) {
                (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User record not found', 404);
                return;
            }
            (0, response_1.sendSuccess)(res, { user });
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    /**
     * Logout
     */
    static async logout(_req, res) {
        (0, response_1.sendSuccess)(res, null, 'Logged out successfully');
    }
    /**
     * Demo Login for development, testing, and offline presentation
     */
    static async demoLogin(req, res) {
        try {
            const { name, phone, role } = req.body;
            const result = await auth_service_1.AuthService.demoLogin(name, phone, role);
            (0, response_1.sendSuccess)(res, {
                user: result.user.toSafeUser ? result.user.toSafeUser() : {
                    id: result.user._id,
                    name: result.user.name,
                    phone: result.user.phone,
                    role: result.user.role,
                    avatarInitial: result.user.avatarInitial,
                    isActive: result.user.isActive,
                    mustChangePassword: result.user.mustChangePassword,
                },
                tokens: result.tokens,
            }, 'Login successful');
        }
        catch (err) {
            (0, response_1.sendError)(res, 'LOGIN_FAILED', err.message || 'Login failed', 400);
        }
    }
}
exports.AuthController = AuthController;
