"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintController = exports.CreateComplaintSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
const complaint_model_1 = require("./complaint.model");
const request_model_1 = require("../requests/request.model");
const user_model_1 = require("../users/user.model");
const notification_model_1 = require("../notifications/notification.model");
const roles_1 = require("../../shared/constants/roles");
const response_1 = require("../../shared/utils/response");
exports.CreateComplaintSchema = zod_1.z.object({
    requestId: zod_1.z.string().min(1, 'Request ID is required'),
    description: zod_1.z.string().min(5, 'Complaint description must be at least 5 characters').max(2000),
});
class ComplaintController {
    static async create(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const { requestId, description } = req.body;
            const request = await request_model_1.ServiceRequestModel.findById(requestId);
            if (!request) {
                (0, response_1.sendError)(res, 'REQUEST_NOT_FOUND', 'Selected order was not found', 404);
                return;
            }
            // Check customer ownership
            if (request.customerId.toString() !== req.user.id) {
                (0, response_1.sendError)(res, 'FORBIDDEN', 'You can only raise complaints for your own orders', 403);
                return;
            }
            const complaint = await complaint_model_1.ComplaintModel.create({
                customerId: new mongoose_1.Types.ObjectId(req.user.id),
                requestId: request._id,
                requestNumberSnapshot: request.requestNumber,
                serviceTitleSnapshot: request.snapshotTitle,
                description,
            });
            // Notify Owner
            try {
                const owners = await user_model_1.UserModel.find({ role: roles_1.UserRole.OWNER, isActive: true });
                for (const owner of owners) {
                    await notification_model_1.NotificationModel.create({
                        recipientUserId: owner._id,
                        title: `Complaint for ${request.requestNumber}`,
                        body: `${req.user.name} reported an issue: "${description.slice(0, 80)}..."`,
                        type: notification_model_1.NotificationType.COMPLAINT,
                        entityId: complaint._id,
                        entityType: 'Complaint',
                    });
                }
            }
            catch (err) {
                console.warn('[ComplaintController] Failed to notify owner:', err);
            }
            (0, response_1.sendSuccess)(res, complaint, 'Complaint submitted successfully', 201);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'CREATE_COMPLAINT_FAILED', err.message, 500);
        }
    }
    static async getMyComplaints(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const complaints = await complaint_model_1.ComplaintModel.find({ customerId: new mongoose_1.Types.ObjectId(req.user.id) })
                .sort({ createdAt: -1 })
                .lean();
            (0, response_1.sendSuccess)(res, complaints);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async getAllComplaints(_req, res) {
        try {
            const complaints = await complaint_model_1.ComplaintModel.find()
                .sort({ createdAt: -1 })
                .lean();
            (0, response_1.sendSuccess)(res, complaints);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
}
exports.ComplaintController = ComplaintController;
