import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../shared/constants/roles';

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  avatarInitial: string;
  isActive: boolean;
  mustChangePassword: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: Date | null;
  passwordResetTokenHash?: string | null;
  passwordResetTokenExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidate: string): Promise<boolean>;
  toSafeUser(): Record<string, any>;
}

const UserSchema = new Schema<IUser>(
  {
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
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      required: true,
    },
    avatarInitial: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    mustChangePassword: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetTokenExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ phone: 1, role: 1 }, { sparse: true });
UserSchema.index({ role: 1, isActive: 1 });

UserSchema.pre<IUser>('save', function (next) {
  if (this.name && !this.avatarInitial) {
    this.avatarInitial = this.name.trim().charAt(0).toUpperCase();
  }
  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  const cleanHash = this.passwordHash.replace(/,\s*$/, '').trim();
  return bcrypt.compare(candidate, cleanHash);
};

UserSchema.methods.toSafeUser = function (): Record<string, any> {
  const cleanRole = (this.role || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  return {
    id: this._id.toString(),
    name: (this.name || '').replace(/,\s*$/, '').trim(),
    email: this.email ? this.email.replace(/,\s*$/, '').trim() : null,
    phone: this.phone ? this.phone.replace(/,\s*$/, '').trim() : null,
    role: cleanRole || this.role,
    avatarInitial: this.avatarInitial || (this.name ? this.name.charAt(0).toUpperCase() : 'U'),
    isActive: this.isActive,
    mustChangePassword: this.mustChangePassword,
    isEmailVerified: this.isEmailVerified || false,
    lastLoginAt: this.lastLoginAt || null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);
