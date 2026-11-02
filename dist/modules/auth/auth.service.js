"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const roles_1 = require("../../shared/constants/roles");
const user_model_1 = require("../users/user.model");
const email_service_1 = require("../../shared/services/email.service");
class AuthService {
    static generateTokens(user) {
        const payload = {
            id: user._id.toString(),
            phone: user.phone || undefined,
            email: user.email || undefined,
            role: user.role,
            name: user.name,
            mustChangePassword: user.mustChangePassword,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, env_1.config.jwt.secret, {
            expiresIn: env_1.config.jwt.expiresIn,
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.config.jwt.refreshSecret, {
            expiresIn: env_1.config.jwt.refreshExpiresIn,
        });
        return { accessToken, refreshToken };
    }
    /**
     * Public Customer Registration.
     * STRICT SECURITY: Always assigns UserRole.CUSTOMER regardless of any client role param.
     */
    static async registerCustomer(data) {
        const normalizedEmail = data.email.trim().toLowerCase();
        // Check if email already registered
        const existing = await user_model_1.UserModel.findOne({ email: normalizedEmail });
        if (existing) {
            throw new Error('EMAIL_ALREADY_EXISTS');
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
        const user = await user_model_1.UserModel.create({
            name: data.name.trim(),
            email: normalizedEmail,
            phone: data.phone?.trim() || undefined,
            passwordHash,
            role: roles_1.UserRole.CUSTOMER, // Strictly CUSTOMER
            isActive: true,
            mustChangePassword: false,
            avatarInitial: data.name.trim().charAt(0).toUpperCase(),
        });
        const tokens = this.generateTokens(user);
        return {
            user: user.toSafeUser(),
            tokens,
            mustChangePassword: false,
        };
    }
    /**
     * Common Centralized Login for all roles (Customer, Engineer, Admin).
     * The database role is the single source of truth.
     */
    static async login(data) {
        const normalizedEmail = data.email.trim().toLowerCase();
        const user = await user_model_1.UserModel.findOne({ email: normalizedEmail }).select('+passwordHash');
        if (!user || !user.passwordHash) {
            // Generic error prevents account enumeration
            throw new Error('INVALID_CREDENTIALS');
        }
        const isMatch = await user.comparePassword(data.password);
        if (!isMatch) {
            throw new Error('INVALID_CREDENTIALS');
        }
        if (!user.isActive) {
            throw new Error('ACCOUNT_DEACTIVATED');
        }
        user.lastLoginAt = new Date();
        await user.save();
        const tokens = this.generateTokens(user);
        return {
            user: user.toSafeUser(),
            tokens,
            mustChangePassword: user.mustChangePassword,
        };
    }
    /**
     * Mandatory or voluntary password change.
     */
    static async changePassword(userId, currentPassword, newPassword) {
        const user = await user_model_1.UserModel.findById(userId).select('+passwordHash');
        if (!user || !user.passwordHash) {
            throw new Error('USER_NOT_FOUND');
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            throw new Error('INVALID_CURRENT_PASSWORD');
        }
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        user.mustChangePassword = false;
        await user.save();
    }
    /**
     * Request password reset token.
     * Returns generic success to prevent email enumeration.
     */
    static async forgotPassword(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await user_model_1.UserModel.findOne({ email: normalizedEmail, isActive: true });
        if (!user) {
            // Return simulated success to avoid leaking email existence
            return { delivered: true, simulated: true };
        }
        // 8-character uppercase cryptographic hex token (e.g. "A3F8B12C")
        const resetToken = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
        const tokenHash = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetTokenHash = tokenHash;
        user.passwordResetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();
        return email_service_1.EmailService.sendPasswordReset({
            email: user.email,
            name: user.name,
            resetToken,
        });
    }
    /**
     * Reset password using token.
     */
    static async resetPassword(token, newPassword) {
        const tokenHash = crypto_1.default.createHash('sha256').update(token.trim().toUpperCase()).digest('hex');
        const user = await user_model_1.UserModel.findOne({
            passwordResetTokenHash: tokenHash,
            passwordResetTokenExpiresAt: { $gt: new Date() },
        }).select('+passwordResetTokenHash +passwordResetTokenExpiresAt');
        if (!user) {
            throw new Error('INVALID_OR_EXPIRED_TOKEN');
        }
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        user.passwordResetTokenHash = null;
        user.passwordResetTokenExpiresAt = null;
        user.mustChangePassword = false;
        await user.save();
    }
    /**
     * Demo Login for development, automated testing, and offline presentation.
     */
    static async demoLogin(name, phone, role) {
        let user = await user_model_1.UserModel.findOne({ phone, role });
        if (!user) {
            user = await user_model_1.UserModel.create({
                name: name.trim() || 'User',
                phone: phone.trim(),
                role,
                avatarInitial: (name.trim() || 'U').charAt(0).toUpperCase(),
                isActive: true,
                mustChangePassword: false,
            });
        }
        else if (name && user.name !== name) {
            user.name = name;
            user.avatarInitial = name.charAt(0).toUpperCase();
            await user.save();
        }
        const tokens = this.generateTokens(user);
        return { user, tokens };
    }
    static async getCurrentUser(userId) {
        const user = await user_model_1.UserModel.findById(userId);
        return user ? user.toSafeUser() : null;
    }
}
exports.AuthService = AuthService;
