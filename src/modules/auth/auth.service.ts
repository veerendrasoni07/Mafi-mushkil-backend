import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { UserRole } from '../../shared/constants/roles';
import { UserModel, IUser } from '../users/user.model';
import { JwtPayload } from '../../middleware/auth.middleware';
import { EmailService, EmailResult } from '../../shared/services/email.service';

export interface AuthSuccessResult {
  user: Record<string, any>;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  mustChangePassword?: boolean;
}

export class AuthService {
  static generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      id: user._id.toString(),
      phone: user.phone || undefined,
      email: user.email || undefined,
      role: user.role,
      name: user.name,
      mustChangePassword: user.mustChangePassword,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Public Customer Registration.
   * STRICT SECURITY: Always assigns UserRole.CUSTOMER regardless of any client role param.
   */
  static async registerCustomer(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthSuccessResult> {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check if email already registered
    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await UserModel.create({
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone?.trim() || undefined,
      passwordHash,
      role: UserRole.CUSTOMER, // Strictly CUSTOMER
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
  static async login(data: { email: string; password: string }): Promise<AuthSuccessResult> {
    const normalizedEmail = data.email.trim().toLowerCase();

    const user = await UserModel.findOne({ email: normalizedEmail }).select('+passwordHash');
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
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await UserModel.findById(userId).select('+passwordHash');
    if (!user || !user.passwordHash) {
      throw new Error('USER_NOT_FOUND');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('INVALID_CURRENT_PASSWORD');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();
  }

  /**
   * Request password reset token.
   * Returns generic success to prevent email enumeration.
   */
  static async forgotPassword(email: string): Promise<EmailResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail, isActive: true });

    if (!user) {
      // Return simulated success to avoid leaking email existence
      return { delivered: true, simulated: true };
    }

    // 8-character uppercase cryptographic hex token (e.g. "A3F8B12C")
    const resetToken = crypto.randomBytes(4).toString('hex').toUpperCase();
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    return EmailService.sendPasswordReset({
      email: user.email!,
      name: user.name,
      resetToken,
    });
  }

  /**
   * Reset password using token.
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token.trim().toUpperCase()).digest('hex');

    const user = await UserModel.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetTokenExpiresAt');

    if (!user) {
      throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;
    user.mustChangePassword = false;
    await user.save();
  }

  /**
   * Demo Login for development, automated testing, and offline presentation.
   */
  static async demoLogin(
    name: string,
    phone: string,
    role: UserRole
  ): Promise<{ user: IUser; tokens: { accessToken: string; refreshToken: string } }> {
    let user = await UserModel.findOne({ phone, role });

    if (!user) {
      user = await UserModel.create({
        name: name.trim() || 'User',
        phone: phone.trim(),
        role,
        avatarInitial: (name.trim() || 'U').charAt(0).toUpperCase(),
        isActive: true,
        mustChangePassword: false,
      });
    } else if (name && user.name !== name) {
      user.name = name;
      user.avatarInitial = name.charAt(0).toUpperCase();
      await user.save();
    }

    const tokens = this.generateTokens(user);
    return { user, tokens };
  }

  static async getCurrentUser(userId: string): Promise<Record<string, any> | null> {
    const user = await UserModel.findById(userId);
    return user ? user.toSafeUser() : null;
  }
}
