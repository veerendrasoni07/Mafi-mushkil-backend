import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { UserRole } from '../../shared/constants/roles';
import { sendSuccess, sendError } from '../../shared/utils/response';

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
  static async demoLogin(req: Request, res: Response): Promise<void> {
    try {
      const { name, phone, role } = req.body;
      const result = await AuthService.demoLogin(name, phone, role);
      sendSuccess(
        res,
        {
          user: {
            id: result.user._id,
            name: result.user.name,
            phone: result.user.phone,
            role: result.user.role,
            avatarInitial: result.user.avatarInitial,
          },
          tokens: result.tokens,
        },
        'Login successful'
      );
    } catch (err: any) {
      sendError(res, 'LOGIN_FAILED', err.message || 'Login failed', 400);
    }
  }

  static async requestOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;
      await AuthService.requestOtp(phone);
      sendSuccess(res, null, 'OTP sent successfully');
    } catch (err: any) {
      sendError(res, 'OTP_REQUEST_FAILED', err.message || 'Failed to request OTP', 400);
    }
  }

  static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone, otp, name } = req.body;
      const result = await AuthService.verifyOtp(phone, otp, name);
      sendSuccess(
        res,
        {
          user: {
            id: result.user._id,
            name: result.user.name,
            phone: result.user.phone,
            role: result.user.role,
            avatarInitial: result.user.avatarInitial,
          },
          tokens: result.tokens,
        },
        'OTP verified successfully'
      );
    } catch (err: any) {
      if (err.message === 'INVALID_OTP') {
        sendError(res, 'INVALID_OTP', 'The provided OTP is invalid or has expired', 400);
        return;
      }
      sendError(res, 'VERIFY_FAILED', err.message || 'OTP verification failed', 400);
    }
  }

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
      sendSuccess(res, {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          avatarInitial: user.avatarInitial,
        },
      });
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, null, 'Logged out successfully');
  }
}
