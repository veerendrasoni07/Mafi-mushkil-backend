import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { UserRole } from '../../shared/constants/roles';
import { sendSuccess, sendError } from '../../shared/utils/response';

export const RegisterCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Valid email address is required').max(150),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20).optional(),
  // Discard any role supplied by client — public registration is strictly CUSTOMER
  role: z.any().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Valid email address is required'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(4, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
});

export const DemoLoginSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(8, 'Valid phone number is required').max(20),
  role: z.nativeEnum(UserRole),
});

export const RequestOtpSchema = z.object({
  phone: z.string().min(8, 'Valid phone number is required').max(20),
});

export const VerifyOtpSchema = z.object({
  phone: z.string().min(8, 'Valid phone number is required').max(20),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  name: z.string().max(100).optional(),
});

export class AuthController {
  /**
   * Public Customer Registration
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, phone } = req.body;
      const result = await AuthService.registerCustomer({ name, email, password, phone });
      sendSuccess(res, result, 'Customer account created successfully', 201);
    } catch (err: any) {
      if (err.message === 'EMAIL_ALREADY_EXISTS') {
        sendError(res, 'EMAIL_EXISTS', 'An account with this email address already exists.', 400);
        return;
      }
      sendError(res, 'REGISTRATION_FAILED', err.message || 'Registration failed', 400);
    }
  }

  /**
   * Common Centralized Login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      sendSuccess(res, result, 'Login successful');
    } catch (err: any) {
      if (err.message === 'INVALID_CREDENTIALS') {
        sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
        return;
      }
      if (err.message === 'ACCOUNT_DEACTIVATED') {
        sendError(
          res,
          'ACCOUNT_DEACTIVATED',
          'Your account has been deactivated. Please contact support or your administrator.',
          403
        );
        return;
      }
      sendError(res, 'LOGIN_FAILED', err.message || 'Login failed', 400);
    }
  }

  /**
   * Change Password (Voluntary or First-Time Mandatory)
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (err: any) {
      if (err.message === 'INVALID_CURRENT_PASSWORD') {
        sendError(res, 'INVALID_PASSWORD', 'The current password you provided is incorrect.', 400);
        return;
      }
      sendError(res, 'PASSWORD_CHANGE_FAILED', err.message || 'Failed to change password', 400);
    }
  }

  /**
   * Forgot Password
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      sendSuccess(
        res,
        {
          delivered: result.delivered,
          simulated: result.simulated || false,
        },
        'If an account exists with that email address, password reset instructions have been sent.'
      );
    } catch (err: any) {
      sendError(res, 'FORGOT_PASSWORD_FAILED', err.message || 'Request failed', 400);
    }
  }

  /**
   * Reset Password
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      await AuthService.resetPassword(token, newPassword);
      sendSuccess(res, null, 'Your password has been reset successfully. You may now log in with your new password.');
    } catch (err: any) {
      if (err.message === 'INVALID_OR_EXPIRED_TOKEN') {
        sendError(res, 'INVALID_TOKEN', 'The reset token is invalid or has expired.', 400);
        return;
      }
      sendError(res, 'RESET_FAILED', err.message || 'Password reset failed', 400);
    }
  }

  /**
   * Get Current Authenticated Profile
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
        return;
      }
      const user = await AuthService.getCurrentUser(req.user.id);
      if (!user) {
        sendError(res, 'USER_NOT_FOUND', 'User record not found', 404);
        return;
      }
      sendSuccess(res, { user });
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  /**
   * Logout
   */
  static async logout(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, null, 'Logged out successfully');
  }

  /**
   * Demo Login for development, testing, and offline presentation
   */
  static async demoLogin(req: Request, res: Response): Promise<void> {
    try {
      const { name, phone, role } = req.body;
      const result = await AuthService.demoLogin(name, phone, role);
      sendSuccess(
        res,
        {
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
        },
        'Login successful'
      );
    } catch (err: any) {
      sendError(res, 'LOGIN_FAILED', err.message || 'Login failed', 400);
    }
  }
}
