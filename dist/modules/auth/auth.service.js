"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const roles_1 = require("../../shared/constants/roles");
const user_model_1 = require("../users/user.model");
class AuthService {
    static generateTokens(user) {
        const payload = {
            id: user._id.toString(),
            phone: user.phone,
            role: user.role,
            name: user.name,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, env_1.config.jwt.secret, {
            expiresIn: env_1.config.jwt.expiresIn,
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.config.jwt.refreshSecret, {
            expiresIn: env_1.config.jwt.refreshExpiresIn,
        });
        return { accessToken, refreshToken };
    }
    static async demoLogin(name, phone, role) {
        let user = await user_model_1.UserModel.findOne({ phone, role });
        if (!user) {
            user = await user_model_1.UserModel.create({
                name: name.trim() || 'User',
                phone: phone.trim(),
                role,
                avatarInitial: (name.trim() || 'U').charAt(0).toUpperCase(),
                isActive: true,
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
    // In-memory OTP storage for dev/testing
    static otpStore = new Map();
    static async requestOtp(phone) {
        const otp = '123456'; // Standard predictable test OTP or random
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        this.otpStore.set(phone.trim(), { otp, expiresAt });
        console.log(`[AuthService] OTP for ${phone}: ${otp}`);
        return otp;
    }
    static async verifyOtp(phone, otp, name) {
        const record = this.otpStore.get(phone.trim());
        // In dev, accept '123456' as master bypass OTP
        const isValid = (record && record.otp === otp && Date.now() <= record.expiresAt) || otp === '123456';
        if (!isValid) {
            throw new Error('INVALID_OTP');
        }
        this.otpStore.delete(phone.trim());
        let user = await user_model_1.UserModel.findOne({ phone: phone.trim(), role: roles_1.UserRole.CUSTOMER });
        if (!user) {
            user = await user_model_1.UserModel.create({
                name: name?.trim() || 'Customer',
                phone: phone.trim(),
                role: roles_1.UserRole.CUSTOMER,
                avatarInitial: (name?.trim() || 'C').charAt(0).toUpperCase(),
                isActive: true,
            });
        }
        const tokens = this.generateTokens(user);
        return { user, tokens };
    }
    static async getCurrentUser(userId) {
        return user_model_1.UserModel.findById(userId);
    }
}
exports.AuthService = AuthService;
