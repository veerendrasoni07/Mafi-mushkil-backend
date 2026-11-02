import mongoose, { Document, Schema, Types } from 'mongoose';

export enum NotificationType {
  ASSIGNMENT = 'ASSIGNMENT',
  RESOLUTION = 'RESOLUTION',
  COMPLAINT = 'COMPLAINT',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
}

export interface INotification extends Document {
  recipientUserId: Types.ObjectId;
  title: string;
  body: string;
  type: NotificationType;
  entityId?: Types.ObjectId;
  entityType?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.SYSTEM,
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId },
    entityType: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientUserId: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
