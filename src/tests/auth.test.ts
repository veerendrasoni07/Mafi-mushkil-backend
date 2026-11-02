import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { UserModel } from '../modules/users/user.model';
import { UserRole } from '../shared/constants/roles';
import bcrypt from 'bcryptjs';

describe('Role-Based Authentication & Authorization System', () => {
  let mongoServer: MongoMemoryServer;
  let server: http.Server;
  let baseUrl: string;

  // Track tokens
  let adminToken: string;
  let engineerToken: string;
  let engineerUser: any;
  let customerToken: string;
  let customerUser: any;

  before(async () => {
    // Spin up in-memory mongo
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Spin up test express app
    const app = createApp();
    server = app.listen(0);
    const address = server.address() as any;
    baseUrl = `http://localhost:${address.port}/api/v1`;

    // Seed baseline Admin
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
    await UserModel.create({
      name: 'Super Admin',
      email: 'admin@mafimushkil.com',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
      mustChangePassword: false,
    });
  });

  after(async () => {
    if (server) server.close();
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  // Helper fetch function
  async function api(path: string, options: any = {}) {
    const url = `${baseUrl}${path}`;
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data: any = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  // 1 & 2. Public customer registration
  test('1 & 2: Public registration creates a CUSTOMER account successfully', async () => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: {
        name: 'John Customer',
        email: 'john.customer@example.com',
        password: 'Password123!',
        phone: '+919111122222',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.user.role, 'CUSTOMER');
    assert.equal(res.data.data.user.email, 'john.customer@example.com');
    assert.ok(res.data.data.tokens.accessToken);

    customerToken = res.data.data.tokens.accessToken;
    customerUser = res.data.data.user;
  });

  // 3 & 4. Public registration role spoofing protection
  test('3: Public registration with role: ADMIN is ignored and strictly creates CUSTOMER', async () => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: {
        name: 'Hacker Admin',
        email: 'hacker.admin@example.com',
        password: 'Password123!',
        role: 'ADMIN',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.data.user.role, 'CUSTOMER', 'Role MUST be forced to CUSTOMER');
  });

  test('4: Public registration with role: ENGINEER is ignored and strictly creates CUSTOMER', async () => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: {
        name: 'Fake Engineer',
        email: 'fake.engineer@example.com',
        password: 'Password123!',
        role: 'ENGINEER',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.data.user.role, 'CUSTOMER', 'Role MUST be forced to CUSTOMER');
  });

  // 5. Customer can log in
  test('5: Customer can log in with email and password', async () => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: {
        email: 'john.customer@example.com',
        password: 'Password123!',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.user.role, 'CUSTOMER');
    assert.ok(res.data.data.tokens.accessToken);
  });

  // 7. Admin can log in
  test('7: Admin can log in using authorized credentials', async () => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@mafimushkil.com',
        password: 'AdminPassword123!',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.user.role, 'ADMIN');
    assert.ok(res.data.data.tokens.accessToken);
    adminToken = res.data.data.tokens.accessToken;
  });

  // 8. Admin can create an engineer account
  let tempEngineerPassword = '';
  test('8: Admin can create an engineer account with secure temporary password', async () => {
    const res = await api('/engineers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Engineer Robert',
        email: 'robert.engineer@example.com',
        phone: '+919800099999',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.engineer.role, 'ENGINEER');
    assert.equal(res.data.data.engineer.mustChangePassword, true);
    assert.ok(res.data.data.notice);

    // In dev / test when SMTP is not set, temporaryPassword is provided for initial handover
    tempEngineerPassword = res.data.data.temporaryPassword;
    assert.ok(tempEngineerPassword.startsWith('Eng#'));
    engineerUser = res.data.data.engineer;
  });

  // 9 & 10. Customer & Engineer cannot create engineer accounts
  test('9: Customer cannot create an engineer account (HTTP 403)', async () => {
    const res = await api('/engineers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        name: 'Illegal Engineer',
        email: 'illegal@example.com',
      },
    });

    assert.equal(res.status, 403);
    assert.equal(res.data.error.code, 'FORBIDDEN');
  });

  // 6. Engineer logs in using temporary password
  test('6: Engineer can log in using admin-created credentials and receives mustChangePassword: true', async () => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: {
        email: 'robert.engineer@example.com',
        password: tempEngineerPassword,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.role, 'ENGINEER');
    assert.equal(res.data.data.mustChangePassword, true);
    engineerToken = res.data.data.tokens.accessToken;
  });

  // 10. Engineer cannot create another engineer
  test('10: Engineer cannot create another engineer (HTTP 403)', async () => {
    const res = await api('/engineers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${engineerToken}` },
      body: {
        name: 'Illegal Engineer by Engineer',
        email: 'illegal2@example.com',
      },
    });

    assert.equal(res.status, 403);
  });

  // 11 & 12. Cross-role API authorization
  test('11: Engineer cannot access Admin engineer list (HTTP 403)', async () => {
    const res = await api('/engineers', {
      method: 'GET',
      headers: { Authorization: `Bearer ${engineerToken}` },
    });

    assert.equal(res.status, 403);
  });

  test('12: Customer cannot access Engineer or Admin routes (HTTP 403)', async () => {
    const engRes = await api('/engineers/my-tasks', {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(engRes.status, 403);

    const adminRes = await api('/engineers', {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(adminRes.status, 403);
  });

  // 15. Temporary passwords require password change before accessing engineer tasks
  test('15: Engineer with temporary password is blocked from accessing tasks (403 PASSWORD_CHANGE_REQUIRED)', async () => {
    const res = await api('/engineers/my-tasks', {
      method: 'GET',
      headers: { Authorization: `Bearer ${engineerToken}` },
    });

    assert.equal(res.status, 403);
    assert.equal(res.data.error.code, 'PASSWORD_CHANGE_REQUIRED');
  });

  // 16. Engineer changes password
  test('16: Engineer changes password successfully and mustChangePassword is set to false', async () => {
    const res = await api('/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${engineerToken}` },
      body: {
        currentPassword: tempEngineerPassword,
        newPassword: 'PermEngineerPassword123!',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);

    // Verify engineer can now access tasks
    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: {
        email: 'robert.engineer@example.com',
        password: 'PermEngineerPassword123!',
      },
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.data.data.mustChangePassword, false);
    engineerToken = loginRes.data.data.tokens.accessToken;

    const taskRes = await api('/engineers/my-tasks', {
      method: 'GET',
      headers: { Authorization: `Bearer ${engineerToken}` },
    });
    assert.equal(taskRes.status, 200);
  });

  // 13 & 14. Admin can deactivate and activate engineers
  test('13 & 14: Admin can deactivate an engineer; deactivated engineer cannot log in or access protected features', async () => {
    // Admin deactivates engineer
    const deactivateRes = await api(`/engineers/${engineerUser.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isActive: false },
    });
    assert.equal(deactivateRes.status, 200);
    assert.equal(deactivateRes.data.data.isActive, false);

    // Attempted access with existing token returns 403 ACCOUNT_DEACTIVATED
    const taskRes = await api('/engineers/my-tasks', {
      method: 'GET',
      headers: { Authorization: `Bearer ${engineerToken}` },
    });
    assert.equal(taskRes.status, 403);
    assert.equal(taskRes.data.error.code, 'ACCOUNT_DEACTIVATED');

    // Attempted login returns 403 ACCOUNT_DEACTIVATED
    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: {
        email: 'robert.engineer@example.com',
        password: 'PermEngineerPassword123!',
      },
    });
    assert.equal(loginRes.status, 403);
    assert.equal(loginRes.data.error.code, 'ACCOUNT_DEACTIVATED');

    // Reactivate engineer
    const reactivateRes = await api(`/engineers/${engineerUser.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isActive: true },
    });
    assert.equal(reactivateRes.status, 200);
    assert.equal(reactivateRes.data.data.isActive, true);
  });

  // 17. Forgot password and reset password flow
  test('17: Forgot-password token generation, reset, and one-time token invalidation', async () => {
    // Customer requests reset
    const forgotRes = await api('/auth/forgot-password', {
      method: 'POST',
      body: { email: 'john.customer@example.com' },
    });
    assert.equal(forgotRes.status, 200);

    // Retrieve user from DB to obtain token hash
    const dbCustomer = await UserModel.findOne({ email: 'john.customer@example.com' }).select(
      '+passwordResetTokenHash +passwordResetTokenExpiresAt'
    );
    assert.ok(dbCustomer?.passwordResetTokenHash);
    assert.ok(dbCustomer?.passwordResetTokenExpiresAt);

    // Create a known token for test
    const testToken = 'RESET123';
    const crypto = await import('crypto');
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
    assert.equal(resetRes.status, 200);

    // Verify token cannot be reused
    const reuseRes = await api('/auth/reset-password', {
      method: 'POST',
      body: {
        token: testToken,
        newPassword: 'AnotherPassword123!',
      },
    });
    assert.equal(reuseRes.status, 400);
    assert.equal(reuseRes.data.error.code, 'INVALID_TOKEN');

    // Verify login with new password
    const newLoginRes = await api('/auth/login', {
      method: 'POST',
      body: {
        email: 'john.customer@example.com',
        password: 'BrandNewPassword123!',
      },
    });
    assert.equal(newLoginRes.status, 200);
  });
});
