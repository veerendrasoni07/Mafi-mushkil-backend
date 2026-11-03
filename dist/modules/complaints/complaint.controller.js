"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintController = exports.CreateComplaintSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
const complaint_model_1 = require("./complaint.model");
const request_model_1 = require("../requests/request.model");
const catalog_models_1 = require("../catalog/catalog.models");
const user_model_1 = require("../users/user.model");
const notification_model_1 = require("../notifications/notification.model");
const roles_1 = require("../../shared/constants/roles");
const response_1 = require("../../shared/utils/response");
exports.CreateComplaintSchema = zod_1.z.object({
    requestId: zod_1.z.string().optional(),
    serviceId: zod_1.z.string().optional(),
    complaintTypeId: zod_1.z.string().optional(),
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
            const { requestId, serviceId, complaintTypeId, serviceTitle, issueCategory, description } = req.body;
            let requestObjId;
            let serviceObjId;
            let complaintTypeObjId;
            let requestNumber = 'General';
            let serviceSnapshot = serviceTitle || 'General Issue';
            let finalIssueCategory = issueCategory;
            // 1. Guard against sub-services being submitted as complaint types
            if (complaintTypeId) {
                if (!mongoose_1.Types.ObjectId.isValid(complaintTypeId)) {
                    (0, response_1.sendError)(res, 'INVALID_COMPLAINT_TYPE_ID', 'Invalid complaint type ID format', 400);
                    return;
                }
                const categoryAsSubService = await catalog_models_1.CategoryModel.findById(complaintTypeId);
                if (categoryAsSubService) {
                    (0, response_1.sendError)(res, 'INVALID_COMPLAINT_TYPE', 'Sub-services cannot be submitted as complaint types. Please select a valid complaint type.', 400);
                    return;
                }
                const complaintType = await catalog_models_1.ComplaintTypeModel.findById(complaintTypeId);
                if (!complaintType) {
                    (0, response_1.sendError)(res, 'COMPLAINT_TYPE_NOT_FOUND', 'The specified complaint type was not found', 404);
                    return;
                }
                complaintTypeObjId = complaintType._id;
                if (!finalIssueCategory) {
                    finalIssueCategory = complaintType.title;
                }
                if (serviceId) {
                    if (complaintType.serviceId.toString() !== serviceId) {
                        (0, response_1.sendError)(res, 'SERVICE_MISMATCH', 'The selected complaint type does not belong to the selected service', 400);
                        return;
                    }
                }
                else {
                    serviceObjId = complaintType.serviceId;
                    const parentService = await catalog_models_1.ServiceModel.findById(complaintType.serviceId);
                    if (parentService) {
                        serviceSnapshot = parentService.title;
                    }
                }
            }
            // 2. Resolve service if serviceId provided
            if (serviceId) {
                if (!mongoose_1.Types.ObjectId.isValid(serviceId)) {
                    (0, response_1.sendError)(res, 'INVALID_SERVICE_ID', 'Invalid service ID format', 400);
                    return;
                }
                const service = await catalog_models_1.ServiceModel.findById(serviceId);
                if (!service) {
                    (0, response_1.sendError)(res, 'SERVICE_NOT_FOUND', 'The specified service was not found', 404);
                    return;
                }
                serviceObjId = service._id;
                serviceSnapshot = service.title;
            }
            // 3. Resolve request if requestId provided
            if (requestId) {
                const request = await request_model_1.ServiceRequestModel.findById(requestId);
                if (request) {
                    if (request.customerId.toString() !== req.user.id) {
                        (0, response_1.sendError)(res, 'FORBIDDEN', 'You can only raise complaints for your own orders', 403);
                        return;
                    }
                    requestObjId = request._id;
                    requestNumber = request.requestNumber;
                    if (!serviceSnapshot || serviceSnapshot === 'General Issue') {
                        serviceSnapshot = request.snapshotTitle;
                    }
                    if (!serviceObjId) {
                        serviceObjId = request.serviceId;
                    }
                }
            }
            const complaint = await complaint_model_1.ComplaintModel.create({
                customerId: new mongoose_1.Types.ObjectId(req.user.id),
                serviceId: serviceObjId,
                complaintTypeId: complaintTypeObjId,
                requestId: requestObjId,
                requestNumberSnapshot: requestNumber,
                serviceTitleSnapshot: serviceSnapshot,
                issueCategory: finalIssueCategory,
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
