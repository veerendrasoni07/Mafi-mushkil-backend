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
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("../app");
const env_1 = require("../config/env");
const user_model_1 = require("../modules/users/user.model");
const roles_1 = require("../shared/constants/roles");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
(0, node_test_1.describe)('Role-Based Authentication & Authorization System', () => {
    let server;
    let baseUrl;
    // Track tokens
    let adminToken;
    let engineerToken;
    let engineerUser;
    let customerToken;
    let customerUser;
    const testEmails = [
        'john.customer@example.com',
        'hacker.admin@example.com',
        'fake.engineer@example.com',
        'robert.engineer@example.com',
        'illegal@example.com',
        'illegal2@example.com',
    ];
    (0, node_test_1.before)(async () => {
        const uri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || env_1.config.mongoUri;
        if (mongoose_1.default.connection.readyState === 0) {
            await mongoose_1.default.connect(uri);
        }
        // Clean up any test users from prior runs
        await user_model_1.UserModel.deleteMany({ email: { $in: testEmails } });
        // Spin up test express app
        const app = (0, app_1.createApp)();
        server = app.listen(0);
        const address = server.address();
        baseUrl = `http://localhost:${address.port}/api/v1`;
        // Seed/Update baseline Admin with AdminPassword123!
        const adminPasswordHash = await bcryptjs_1.default.hash('AdminPassword123!', 10);
        await user_model_1.UserModel.findOneAndUpdate({ email: 'admin@mafimushkil.com' }, {
            $set: {
                name: 'Super Admin',
                email: 'admin@mafimushkil.com',
                phone: '+919999900001',
                passwordHash: adminPasswordHash,
                role: roles_1.UserRole.ADMIN,
                isActive: true,
                mustChangePassword: false,
            },
        }, { upsert: true });
    });
    (0, node_test_1.after)(async () => {
        await user_model_1.UserModel.deleteMany({ email: { $in: testEmails } });
        // Restore default password for admin
        const defaultPasswordHash = await bcryptjs_1.default.hash('password123', 10);
        await user_model_1.UserModel.updateOne({ email: 'admin@mafimushkil.com' }, { $set: { passwordHash: defaultPasswordHash } });
        if (server)
            server.close();
        await mongoose_1.default.disconnect();
    });
    // Helper fetch function
    async function api(path, options = {}) {
        const url = `${baseUrl}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        const res = await fetch(url, {
            ...options,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
        const data = await res.json().catch(() => null);
        return { status: res.status, data };
    }
    // 1 & 2. Public customer registration
    (0, node_test_1.test)('1 & 2: Public registration creates a CUSTOMER account successfully', async () => {
        await user_model_1.UserModel.deleteOne({ email: 'john.customer@example.com' });
        const res = await api('/auth/register', {
            method: 'POST',
            body: {
                name: 'John Customer',
                email: 'john.customer@example.com',
                password: 'Password123!',
                phone: '+919111122222',
            },
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.equal(res.data.success, true);
        strict_1.default.equal(res.data.data.user.role, 'CUSTOMER');
        strict_1.default.equal(res.data.data.user.email, 'john.customer@example.com');
        strict_1.default.ok(res.data.data.tokens.accessToken);
        customerToken = res.data.data.tokens.accessToken;
        customerUser = res.data.data.user;
    });
    // 3 & 4. Public registration role spoofing protection
    (0, node_test_1.test)('3: Public registration with role: ADMIN is ignored and strictly creates CUSTOMER', async () => {
        await user_model_1.UserModel.deleteOne({ email: 'hacker.admin@example.com' });
        const res = await api('/auth/register', {
            method: 'POST',
            body: {
                name: 'Hacker Admin',
                email: 'hacker.admin@example.com',
                password: 'Password123!',
                role: 'ADMIN',
            },
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.equal(res.data.data.user.role, 'CUSTOMER', 'Role MUST be forced to CUSTOMER');
    });
    (0, node_test_1.test)('4: Public registration with role: ENGINEER is ignored and strictly creates CUSTOMER', async () => {
        await user_model_1.UserModel.deleteOne({ email: 'fake.engineer@example.com' });
        const res = await api('/auth/register', {
            method: 'POST',
            body: {
                name: 'Fake Engineer',
                email: 'fake.engineer@example.com',
                password: 'Password123!',
                role: 'ENGINEER',
            },
        });
        strict_1.default.equal(res.status, 201, `Expected 201 but got ${res.status}: ${JSON.stringify(res.data)}`);
        strict_1.default.equal(res.data.data.user.role, 'CUSTOMER', 'Role MUST be forced to CUSTOMER');
    });
    // 5. Customer can log in
    (0, node_test_1.test)('5: Customer can log in with email and password', async () => {
        const res = await api('/auth/login', {
            method: 'POST',
            body: {
                email: 'john.customer@example.com',
                password: 'Password123!',
            },
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.data.success, true);
        strict_1.default.equal(res.data.data.user.role, 'CUSTOMER');
        strict_1.default.ok(res.data.data.tokens.accessToken);
    });
    // 7. Admin can log in
    (0, node_test_1.test)('7: Admin can log in using authorized credentials', async () => {
        const res = await api('/auth/login', {
            method: 'POST',
            body: {
                email: 'admin@mafimushkil.com',
                password: 'AdminPassword123!',
            },
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.data.success, true);
        strict_1.default.equal(res.data.data.user.role, 'ADMIN');
        strict_1.default.ok(res.data.data.tokens.accessToken);
        adminToken = res.data.data.tokens.accessToken;
    });
    // 8. Admin can create an engineer account
    let tempEngineerPassword = '';
    (0, node_test_1.test)('8: Admin can create an engineer account with secure temporary password', async () => {
        const res = await api('/engineers', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: {
                name: 'Engineer Robert',
                email: 'robert.engineer@example.com',
                phone: '+919800099999',
            },
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.equal(res.data.success, true);
        strict_1.default.equal(res.data.data.engineer.role, 'ENGINEER');
        strict_1.default.equal(res.data.data.engineer.mustChangePassword, true);
        strict_1.default.ok(res.data.data.notice);
        // In dev / test when SMTP is not set, temporaryPassword is provided for initial handover
        tempEngineerPassword = res.data.data.temporaryPassword;
        strict_1.default.ok(tempEngineerPassword.startsWith('Eng#'));
        engineerUser = res.data.data.engineer;
    });
    // 9 & 10. Customer & Engineer cannot create engineer accounts
    (0, node_test_1.test)('9: Customer cannot create an engineer account (HTTP 403)', async () => {
        const res = await api('/engineers', {
            method: 'POST',
            headers: { Authorization: `Bearer ${customerToken}` },
            body: {
                name: 'Illegal Engineer',
                email: 'illegal@example.com',
            },
        });
        strict_1.default.equal(res.status, 403);
        strict_1.default.equal(res.data.error.code, 'FORBIDDEN');
    });
    // 6. Engineer logs in using temporary password
    (0, node_test_1.test)('6: Engineer can log in using admin-created credentials and receives mustChangePassword: true', async () => {
        const res = await api('/auth/login', {
            method: 'POST',
            body: {
                email: 'robert.engineer@example.com',
                password: tempEngineerPassword,
            },
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.data.data.user.role, 'ENGINEER');
        strict_1.default.equal(res.data.data.mustChangePassword, true);
        engineerToken = res.data.data.tokens.accessToken;
    });
    // 10. Engineer cannot create another engineer
    (0, node_test_1.test)('10: Engineer cannot create another engineer (HTTP 403)', async () => {
        const res = await api('/engineers', {
            method: 'POST',
            headers: { Authorization: `Bearer ${engineerToken}` },
            body: {
                name: 'Illegal Engineer by Engineer',
                email: 'illegal2@example.com',
            },
        });
        strict_1.default.equal(res.status, 403);
    });
    // 11 & 12. Cross-role API authorization
    (0, node_test_1.test)('11: Engineer cannot access Admin engineer list (HTTP 403)', async () => {
        const res = await api('/engineers', {
            method: 'GET',
            headers: { Authorization: `Bearer ${engineerToken}` },
        });
        strict_1.default.equal(res.status, 403);
    });
    (0, node_test_1.test)('12: Customer cannot access Engineer or Admin routes (HTTP 403)', async () => {
        const engRes = await api('/engineers/my-tasks', {
            method: 'GET',
            headers: { Authorization: `Bearer ${customerToken}` },
        });
        strict_1.default.equal(engRes.status, 403);
        const adminRes = await api('/engineers', {
            method: 'GET',
            headers: { Authorization: `Bearer ${customerToken}` },
        });
        strict_1.default.equal(adminRes.status, 403);
    });
    // 15. Temporary passwords require password change before accessing engineer tasks
    (0, node_test_1.test)('15: Engineer with temporary password is blocked from accessing tasks (403 PASSWORD_CHANGE_REQUIRED)', async () => {
        const res = await api('/engineers/my-tasks', {
            method: 'GET',
            headers: { Authorization: `Bearer ${engineerToken}` },
        });
        strict_1.default.equal(res.status, 403);
        strict_1.default.equal(res.data.error.code, 'PASSWORD_CHANGE_REQUIRED');
    });
    // 16. Engineer changes password
    (0, node_test_1.test)('16: Engineer changes password successfully and mustChangePassword is set to false', async () => {
        const res = await api('/auth/change-password', {
            method: 'POST',
            headers: { Authorization: `Bearer ${engineerToken}` },
            body: {
                currentPassword: tempEngineerPassword,
                newPassword: 'PermEngineerPassword123!',
            },
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.data.success, true);
        // Verify engineer can now access tasks
        const loginRes = await api('/auth/login', {
            method: 'POST',
            body: {
                email: 'robert.engineer@example.com',
                password: 'PermEngineerPassword123!',
            },
        });
        strict_1.default.equal(loginRes.status, 200);
        strict_1.default.equal(loginRes.data.data.mustChangePassword, false);
        engineerToken = loginRes.data.data.tokens.accessToken;
        const taskRes = await api('/engineers/my-tasks', {
            method: 'GET',
            headers: { Authorization: `Bearer ${engineerToken}` },
        });
        strict_1.default.equal(taskRes.status, 200);
    });
    // 13 & 14. Admin can deactivate and activate engineers
    (0, node_test_1.test)('13 & 14: Admin can deactivate an engineer; deactivated engineer cannot log in or access protected features', async () => {
        // Admin deactivates engineer
        const deactivateRes = await api(`/engineers/${engineerUser.id}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { isActive: false },
        });
        strict_1.default.equal(deactivateRes.status, 200);
        strict_1.default.equal(deactivateRes.data.data.isActive, false);
        // Attempted access with existing token returns 403 ACCOUNT_DEACTIVATED
        const taskRes = await api('/engineers/my-tasks', {
            method: 'GET',
            headers: { Authorization: `Bearer ${engineerToken}` },
        });
        strict_1.default.equal(taskRes.status, 403);
        strict_1.default.equal(taskRes.data.error.code, 'ACCOUNT_DEACTIVATED');
        // Attempted login returns 403 ACCOUNT_DEACTIVATED
        const loginRes = await api('/auth/login', {
            method: 'POST',
            body: {
                email: 'robert.engineer@example.com',
                password: 'PermEngineerPassword123!',
            },
        });
        strict_1.default.equal(loginRes.status, 403);
        strict_1.default.equal(loginRes.data.error.code, 'ACCOUNT_DEACTIVATED');
        // Reactivate engineer
        const reactivateRes = await api(`/engineers/${engineerUser.id}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { isActive: true },
        });
        strict_1.default.equal(reactivateRes.status, 200);
        strict_1.default.equal(reactivateRes.data.data.isActive, true);
    });
    // 17. Forgot password and reset password flow
    (0, node_test_1.test)('17: Forgot-password token generation, reset, and one-time token invalidation', async () => {
        // Customer requests reset
        const forgotRes = await api('/auth/forgot-password', {
            method: 'POST',
            body: { email: 'john.customer@example.com' },
        });
        strict_1.default.equal(forgotRes.status, 200);
        // Retrieve user from DB to obtain token hash
        const dbCustomer = await user_model_1.UserModel.findOne({ email: 'john.customer@example.com' }).select('+passwordResetTokenHash +passwordResetTokenExpiresAt');
        strict_1.default.ok(dbCustomer?.passwordResetTokenHash);
        strict_1.default.ok(dbCustomer?.passwordResetTokenExpiresAt);
        // Create a known token for test
        const testToken = 'RESET123';
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        dbCustomer.passwordResetTokenHash = crypto
            .createHash('sha256')
            .update(testToken)
            .digest('hex');
        dbCustomer.passwordResetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await dbCustomer.save();
        // Reset password with valid token
        const resetRes = await api('/auth/reset-password', {
            method: 'POST',
            body: {
                token: testToken,
                newPassword: 'BrandNewPassword123!',
            },
        });
        strict_1.default.equal(resetRes.status, 200);
        // Verify token cannot be reused
        const reuseRes = await api('/auth/reset-password', {
            method: 'POST',
            body: {
                token: testToken,
                newPassword: 'AnotherPassword123!',
            },
        });
        strict_1.default.equal(reuseRes.status, 400);
        strict_1.default.equal(reuseRes.data.error.code, 'INVALID_TOKEN');
        // Verify login with new password
        const newLoginRes = await api('/auth/login', {
            method: 'POST',
            body: {
                email: 'john.customer@example.com',
                password: 'BrandNewPassword123!',
            },
        });
        strict_1.default.equal(newLoginRes.status, 200);
    });
});
