"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../config/env");
const user_model_1 = require("../modules/users/user.model");
const roles_1 = require("../shared/constants/roles");
async function bootstrapAdmin() {
    console.log('[Bootstrap] Initializing admin account setup...');
    const email = (process.argv[2] || process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@mafimushkil.com').trim().toLowerCase();
    const password = process.argv[3] || process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@123456';
    const name = process.argv[4] || process.env.BOOTSTRAP_ADMIN_NAME || 'Mafi Mushkil Admin';
    if (!email || !email.includes('@')) {
        console.error('[Bootstrap] Error: Valid email address is required.');
        process.exit(1);
    }
    if (!password || password.length < 8) {
        console.error('[Bootstrap] Error: Password must be at least 8 characters long.');
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(env_1.config.mongoUri);
        console.log('[Bootstrap] Connected to database.');
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Check if an admin or owner account already exists
        let existingUser = await user_model_1.UserModel.findOne({ email });
        if (existingUser) {
            existingUser.role = roles_1.UserRole.ADMIN;
            existingUser.passwordHash = passwordHash;
            existingUser.isActive = true;
            existingUser.mustChangePassword = false;
            if (!existingUser.name)
                existingUser.name = name;
            await existingUser.save();
            console.log(`[Bootstrap] Successfully updated existing account ${email} to ADMIN role with new secure password.`);
        }
        else {
            const newAdmin = await user_model_1.UserModel.create({
                name,
                email,
                phone: '+919999900000',
                passwordHash,
                role: roles_1.UserRole.ADMIN,
                isActive: true,
                mustChangePassword: false,
                avatarInitial: name.charAt(0).toUpperCase(),
            });
            console.log(`[Bootstrap] Created new ADMIN account ${email} (ID: ${newAdmin._id}).`);
        }
        console.log('[Bootstrap] Admin account is active and ready for login.');
    }
    catch (err) {
        console.error('[Bootstrap] Failed to bootstrap admin:', err.message);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('[Bootstrap] Database disconnected.');
    }
}
bootstrapAdmin();
