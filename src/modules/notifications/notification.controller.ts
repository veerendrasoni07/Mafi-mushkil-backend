import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { NotificationModel } from './notification.model';
import { sendSuccess, sendError } from '../../shared/utils/response';

export class NotificationController {
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const userId = req.user.id;
      const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;

      const notifications = await NotificationModel.find({
        $or: [
          ...(userObjectId ? [{ recipientUserId: userObjectId }] : []),
          { recipientUserId: userId as any },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      sendSuccess(res, notifications);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const userId = req.user.id;
      const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;

      const count = await NotificationModel.countDocuments({
        $or: [
          ...(userObjectId ? [{ recipientUserId: userObjectId }] : []),
          { recipientUserId: userId as any },
        ],
        isRead: false,
      });

      sendSuccess(res, { unreadCount: count });
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { id } = req.params;
      const updated = await NotificationModel.findOneAndUpdate(
        { _id: id, recipientUserId: new Types.ObjectId(req.user.id) },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      if (!updated) {
        sendError(res, 'NOT_FOUND', 'Notification not found', 404);
        return;
      }

      sendSuccess(res, updated);
    } catch (err: any) {
      sendError(res, 'UPDATE_FAILED', err.message, 500);
    }
  }

  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      await NotificationModel.updateMany(
        { recipientUserId: new Types.ObjectId(req.user.id), isRead: false },
        { isRead: true, readAt: new Date() }
      );

      sendSuccess(res, null, 'All notifications marked as read');
    } catch (err: any) {
      sendError(res, 'UPDATE_FAILED', err.message, 500);
    }
  }
}
