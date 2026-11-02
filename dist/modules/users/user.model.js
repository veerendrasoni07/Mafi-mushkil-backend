"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const roles_1 = require("../../shared/constants/roles");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true,
        index: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, select: false },
    role: {
        type: String,
        enum: Object.values(roles_1.UserRole),
        default: roles_1.UserRole.CUSTOMER,
        required: true,
    },
    avatarInitial: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    mustChangePassword: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetTokenExpiresAt: { type: Date, default: null, select: false },
}, { timestamps: true });
// Indexes
UserSchema.index({ phone: 1, role: 1 }, { sparse: true });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.pre('save', function (next) {
    if (this.name && !this.avatarInitial) {
        this.avatarInitial = this.name.trim().charAt(0).toUpperCase();
    }
    if (this.email) {
        this.email = this.email.trim().toLowerCase();
    }
    next();
});
UserSchema.methods.comparePassword = async function (candidate) {
    if (!this.passwordHash) {
        return false;
    }
    return bcryptjs_1.default.compare(candidate, this.passwordHash);
};
UserSchema.methods.toSafeUser = function () {
    return {
        id: this._id.toString(),
        name: this.name,
        email: this.email || null,
        phone: this.phone || null,
        role: this.role,
        avatarInitial: this.avatarInitial || (this.name ? this.name.charAt(0).toUpperCase() : 'U'),
        isActive: this.isActive,
        mustChangePassword: this.mustChangePassword,
        isEmailVerified: this.isEmailVerified || false,
        lastLoginAt: this.lastLoginAt || null,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};
exports.UserModel = mongoose_1.default.model('User', UserSchema);
