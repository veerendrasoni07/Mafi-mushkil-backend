import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { UserRole } from '../../shared/constants/roles';
import { UserModel, IUser } from '../users/user.model';
import { JwtPayload } from '../../middleware/auth.middleware';

export class AuthService {
  static generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      id: user._id.toString(),
      phone: user.phone,
      role: user.role,
      name: user.name,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }

  static async demoLogin(name: string, phone: string, role: UserRole): Promise<{ user: IUser; tokens: { accessToken: string; refreshToken: string } }> {
    let user = await UserModel.findOne({ phone, role });

    if (!user) {
      user = await UserModel.create({
        name: name.trim() || 'User',
        phone: phone.trim(),
        role,
        avatarInitial: (name.trim() || 'U').charAt(0).toUpperCase(),
        isActive: true,
      });
    } else if (name && user.name !== name) {
      user.name = name;
      user.avatarInitial = name.charAt(0).toUpperCase();
      await user.save();
    }

    const tokens = this.generateTokens(user);
    return { user, tokens };
  }

  // In-memory OTP storage for dev/testing
  private static otpStore = new Map<string, { otp: string; expiresAt: number }>();

  static async requestOtp(phone: string): Promise<string> {
    const otp = '123456'; // Standard predictable test OTP or random
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    this.otpStore.set(phone.trim(), { otp, expiresAt });
    console.log(`[AuthService] OTP for ${phone}: ${otp}`);
    return otp;
  }

  static async verifyOtp(phone: string, otp: string, name?: string): Promise<{ user: IUser; tokens: { accessToken: string; refreshToken: string } }> {
    const record = this.otpStore.get(phone.trim());

    // In dev, accept '123456' as master bypass OTP
    const isValid = (record && record.otp === otp && Date.now() <= record.expiresAt) || otp === '123456';

    if (!isValid) {
      throw new Error('INVALID_OTP');
    }

    this.otpStore.delete(phone.trim());

    let user = await UserModel.findOne({ phone: phone.trim(), role: UserRole.CUSTOMER });
    if (!user) {
      user = await UserModel.create({
        name: name?.trim() || 'Customer',
        phone: phone.trim(),
        role: UserRole.CUSTOMER,
        avatarInitial: (name?.trim() || 'C').charAt(0).toUpperCase(),
        isActive: true,
      });
    }

    const tokens = this.generateTokens(user);
    return { user, tokens };
  }

  static async getCurrentUser(userId: string): Promise<IUser | null> {
    return UserModel.findById(userId);
  }
}
