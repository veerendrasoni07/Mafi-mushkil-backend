import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '../../shared/constants/roles';

export interface IUser extends Document {
  name: string;
  phone: string;
  role: UserRole;
  avatarInitial: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      required: true,
    },
    avatarInitial: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ phone: 1, role: 1 }, { unique: true });
UserSchema.index({ role: 1, isActive: 1 });

UserSchema.pre<IUser>('save', function (next) {
  if (this.name && !this.avatarInitial) {
    this.avatarInitial = this.name.trim().charAt(0).toUpperCase();
  }
  next();
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);
