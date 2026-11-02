"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const mongoose_1 = require("mongoose");
const notification_model_1 = require("./notification.model");
const response_1 = require("../../shared/utils/response");
class NotificationController {
    static async getNotifications(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const notifications = await notification_model_1.NotificationModel.find({
                recipientUserId: new mongoose_1.Types.ObjectId(req.user.id),
            })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean();
            (0, response_1.sendSuccess)(res, notifications);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async getUnreadCount(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const count = await notification_model_1.NotificationModel.countDocuments({
                recipientUserId: new mongoose_1.Types.ObjectId(req.user.id),
                isRead: false,
            });
            (0, response_1.sendSuccess)(res, { unreadCount: count });
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async markAsRead(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const { id } = req.params;
            const updated = await notification_model_1.NotificationModel.findOneAndUpdate({ _id: id, recipientUserId: new mongoose_1.Types.ObjectId(req.user.id) }, { isRead: true, readAt: new Date() }, { new: true });
            if (!updated) {
                (0, response_1.sendError)(res, 'NOT_FOUND', 'Notification not found', 404);
                return;
            }
            (0, response_1.sendSuccess)(res, updated);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'UPDATE_FAILED', err.message, 500);
        }
    }
    static async markAllAsRead(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            await notification_model_1.NotificationModel.updateMany({ recipientUserId: new mongoose_1.Types.ObjectId(req.user.id), isRead: false }, { isRead: true, readAt: new Date() });
            (0, response_1.sendSuccess)(res, null, 'All notifications marked as read');
        }
        catch (err) {
            (0, response_1.sendError)(res, 'UPDATE_FAILED', err.message, 500);
        }
    }
}
exports.NotificationController = NotificationController;
