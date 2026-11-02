"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = exports.VerifyOtpSchema = exports.RequestOtpSchema = exports.DemoLoginSchema = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("./auth.service");
const roles_1 = require("../../shared/constants/roles");
const response_1 = require("../../shared/utils/response");
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
    static async demoLogin(req, res) {
        try {
            const { name, phone, role } = req.body;
            const result = await auth_service_1.AuthService.demoLogin(name, phone, role);
            (0, response_1.sendSuccess)(res, {
                user: {
                    id: result.user._id,
                    name: result.user.name,
                    phone: result.user.phone,
                    role: result.user.role,
                    avatarInitial: result.user.avatarInitial,
                },
                tokens: result.tokens,
            }, 'Login successful');
        }
        catch (err) {
            (0, response_1.sendError)(res, 'LOGIN_FAILED', err.message || 'Login failed', 400);
        }
    }
    static async requestOtp(req, res) {
        try {
            const { phone } = req.body;
            await auth_service_1.AuthService.requestOtp(phone);
            (0, response_1.sendSuccess)(res, null, 'OTP sent successfully');
        }
        catch (err) {
            (0, response_1.sendError)(res, 'OTP_REQUEST_FAILED', err.message || 'Failed to request OTP', 400);
        }
    }
    static async verifyOtp(req, res) {
        try {
            const { phone, otp, name } = req.body;
            const result = await auth_service_1.AuthService.verifyOtp(phone, otp, name);
            (0, response_1.sendSuccess)(res, {
                user: {
                    id: result.user._id,
                    name: result.user.name,
                    phone: result.user.phone,
                    role: result.user.role,
                    avatarInitial: result.user.avatarInitial,
                },
                tokens: result.tokens,
            }, 'OTP verified successfully');
        }
        catch (err) {
            if (err.message === 'INVALID_OTP') {
                (0, response_1.sendError)(res, 'INVALID_OTP', 'The provided OTP is invalid or has expired', 400);
                return;
            }
            (0, response_1.sendError)(res, 'VERIFY_FAILED', err.message || 'OTP verification failed', 400);
        }
    }
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
            (0, response_1.sendSuccess)(res, {
                user: {
                    id: user._id,
                    name: user.name,
                    phone: user.phone,
                    role: user.role,
                    avatarInitial: user.avatarInitial,
                },
            });
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async logout(_req, res) {
        (0, response_1.sendSuccess)(res, null, 'Logged out successfully');
    }
}
exports.AuthController = AuthController;
