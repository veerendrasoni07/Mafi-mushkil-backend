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
    requestId: zod_1.z.string().optional(),
    serviceTitle: zod_1.z.string().optional(),
    issueCategory: zod_1.z.string().optional(),
    description: zod_1.z.string().min(3, 'Complaint description must be at least 3 characters').max(2000),
});
class ComplaintController {
    static async create(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const { requestId, serviceTitle, issueCategory, description } = req.body;
            let requestObjId;
            let requestNumber = 'General';
            let serviceSnapshot = serviceTitle || 'General Issue';
            if (requestId) {
                const request = await request_model_1.ServiceRequestModel.findById(requestId);
                if (request) {
                    // If customer provided an order, verify ownership
                    if (request.customerId.toString() !== req.user.id) {
                        (0, response_1.sendError)(res, 'FORBIDDEN', 'You can only raise complaints for your own orders', 403);
                        return;
                    }
                    requestObjId = request._id;
                    requestNumber = request.requestNumber;
                    serviceSnapshot = request.snapshotTitle;
                }
            }
            const complaint = await complaint_model_1.ComplaintModel.create({
                customerId: new mongoose_1.Types.ObjectId(req.user.id),
                requestId: requestObjId,
                requestNumberSnapshot: requestNumber,
                serviceTitleSnapshot: serviceSnapshot,
                issueCategory,
                description,
            });
            // Notify Admins/Owners
            try {
                const owners = await user_model_1.UserModel.find({
                    role: { $in: [roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER] },
                    isActive: true,
                });
                for (const owner of owners) {
                    await notification_model_1.NotificationModel.create({
                        recipientUserId: owner._id,
                        title: `Complaint: ${serviceSnapshot}`,
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
