"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestService = void 0;
const mongoose_1 = require("mongoose");
const request_model_1 = require("./request.model");
const catalog_models_1 = require("../catalog/catalog.models");
const user_model_1 = require("../users/user.model");
const notification_model_1 = require("../notifications/notification.model");
const status_1 = require("../../shared/constants/status");
const roles_1 = require("../../shared/constants/roles");
const request_number_1 = require("../../shared/utils/request-number");
class RequestService {
    static async createRequest(input) {
        if (input.idempotencyKey) {
            const existing = await request_model_1.ServiceRequestModel.findOne({ idempotencyKey: input.idempotencyKey });
            if (existing) {
                return existing;
            }
        }
        const customer = await user_model_1.UserModel.findById(input.customerId);
        if (!customer) {
            throw new Error('CUSTOMER_NOT_FOUND');
        }
        const service = await catalog_models_1.ServiceModel.findById(input.serviceId);
        if (!service) {
            throw new Error('SERVICE_NOT_FOUND');
        }
        let snapshotTitle = service.title;
        let snapshotPriceMinorUnits;
        if (input.productId) {
            const product = await catalog_models_1.ProductModel.findById(input.productId);
            if (product) {
                snapshotTitle = `${service.title} - ${product.title}`;
                snapshotPriceMinorUnits = product.priceMinorUnits;
            }
        }
        const requestNumber = await (0, request_number_1.generateNextRequestNumber)();
        const request = await request_model_1.ServiceRequestModel.create({
            requestNumber,
            customerId: customer._id,
            customerNameSnapshot: customer.name,
            customerPhoneSnapshot: customer.phone,
            serviceId: service._id,
            categoryId: input.categoryId ? new mongoose_1.Types.ObjectId(input.categoryId) : undefined,
            productId: input.productId ? new mongoose_1.Types.ObjectId(input.productId) : undefined,
            snapshotTitle,
            snapshotPriceMinorUnits,
            problemDescription: input.problemDescription,
            address: input.address,
            status: status_1.RequestStatus.OPEN,
            idempotencyKey: input.idempotencyKey,
            statusHistory: [
                {
                    status: status_1.RequestStatus.OPEN,
                    changedBy: customer._id,
                    changedAt: new Date(),
                    note: 'Request created by customer',
                },
            ],
        });
        // Notify all admins/owners
        try {
            const owners = await user_model_1.UserModel.find({
                role: { $in: [roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER] },
                isActive: true,
            });
            for (const owner of owners) {
                await notification_model_1.NotificationModel.create({
                    recipientUserId: owner._id,
                    title: `New Request ${request.requestNumber}`,
                    body: `${customer.name} raised a new request for ${snapshotTitle} at ${input.address}.`,
                    type: notification_model_1.NotificationType.SYSTEM,
                    entityId: request._id,
                    entityType: 'ServiceRequest',
                });
            }
        }
        catch (err) {
            console.warn('[RequestService] Notification delivery to owner failed:', err);
        }
        return request;
    }
    static async getCustomerRequests(customerId) {
        return request_model_1.ServiceRequestModel.find({ customerId: new mongoose_1.Types.ObjectId(customerId) })
            .sort({ createdAt: -1 })
            .lean();
    }
    static async getCustomerDashboardSummary(customerId) {
        const custId = new mongoose_1.Types.ObjectId(customerId);
        const [totalOrders, activeOrders, doneOrders, recentOrders] = await Promise.all([
            request_model_1.ServiceRequestModel.countDocuments({ customerId: custId }),
            request_model_1.ServiceRequestModel.countDocuments({
                customerId: custId,
                status: { $in: [status_1.RequestStatus.OPEN, status_1.RequestStatus.ASSIGNED] },
            }),
            request_model_1.ServiceRequestModel.countDocuments({ customerId: custId, status: status_1.RequestStatus.RESOLVED }),
            request_model_1.ServiceRequestModel.find({ customerId: custId }).sort({ createdAt: -1 }).limit(5).lean(),
        ]);
        return {
            totalOrders,
            activeOrders,
            doneOrders,
            recentOrders,
        };
    }
    static async getAllRequests(status) {
        const filter = status ? { status } : {};
        return request_model_1.ServiceRequestModel.find(filter).sort({ createdAt: -1 }).lean();
    }
    static async getOwnerSummary() {
        const [newCount, activeCount, doneCount] = await Promise.all([
            request_model_1.ServiceRequestModel.countDocuments({ status: status_1.RequestStatus.OPEN }),
            request_model_1.ServiceRequestModel.countDocuments({ status: status_1.RequestStatus.ASSIGNED }),
            request_model_1.ServiceRequestModel.countDocuments({ status: status_1.RequestStatus.RESOLVED }),
        ]);
        return {
            newCount,
            activeCount,
            doneCount,
        };
    }
    static async assignEngineer(requestId, engineerId, ownerId) {
        const engineer = await user_model_1.UserModel.findOne({ _id: engineerId, role: roles_1.UserRole.ENGINEER, isActive: true });
        if (!engineer) {
            throw new Error('ENGINEER_NOT_FOUND_OR_INACTIVE');
        }
        const request = await request_model_1.ServiceRequestModel.findById(requestId);
        if (!request) {
            throw new Error('REQUEST_NOT_FOUND');
        }
        if (request.status === status_1.RequestStatus.RESOLVED) {
            throw new Error('CANNOT_ASSIGN_RESOLVED_REQUEST');
        }
        const previousEngineerName = request.assignedEngineerNameSnapshot;
        request.assignedEngineerId = engineer._id;
        request.assignedEngineerNameSnapshot = engineer.name;
        request.assignedAt = new Date();
        request.status = status_1.RequestStatus.ASSIGNED;
        request.statusHistory.push({
            status: status_1.RequestStatus.ASSIGNED,
            changedBy: new mongoose_1.Types.ObjectId(ownerId),
            changedAt: new Date(),
            note: previousEngineerName
                ? `Reassigned from ${previousEngineerName} to ${engineer.name}`
                : `Assigned to ${engineer.name}`,
        });
        await request.save();
        // Notify Customer
        try {
            await notification_model_1.NotificationModel.create({
                recipientUserId: request.customerId,
                title: 'Engineer Assigned',
                body: `${engineer.name} is assigned to your ${request.snapshotTitle} request.`,
                type: notification_model_1.NotificationType.ASSIGNMENT,
                entityId: request._id,
                entityType: 'ServiceRequest',
            });
            // Notify Assigned Engineer
            await notification_model_1.NotificationModel.create({
                recipientUserId: engineer._id,
                title: 'New Task Assigned',
                body: `You have been assigned to request ${request.requestNumber}: ${request.snapshotTitle}.`,
                type: notification_model_1.NotificationType.ASSIGNMENT,
                entityId: request._id,
                entityType: 'ServiceRequest',
            });
        }
        catch (err) {
            console.warn('[RequestService] Notification delivery on assignment failed:', err);
        }
        return request;
    }
    static async resolveRequest(requestId, engineerId) {
        const request = await request_model_1.ServiceRequestModel.findById(requestId);
        if (!request) {
            throw new Error('REQUEST_NOT_FOUND');
        }
        if (!request.assignedEngineerId || request.assignedEngineerId.toString() !== engineerId) {
            throw new Error('UNAUTHORIZED_ENGINEER');
        }
        if (request.status === status_1.RequestStatus.RESOLVED) {
            return request; // Idempotent resolution
        }
        if (request.status !== status_1.RequestStatus.ASSIGNED) {
            throw new Error('INVALID_STATUS_TRANSITION');
        }
        request.status = status_1.RequestStatus.RESOLVED;
        request.resolvedAt = new Date();
        request.statusHistory.push({
            status: status_1.RequestStatus.RESOLVED,
            changedBy: new mongoose_1.Types.ObjectId(engineerId),
            changedAt: new Date(),
            note: 'Marked resolved by assigned engineer',
        });
        await request.save();
        // Notify Customer
        try {
            await notification_model_1.NotificationModel.create({
                recipientUserId: request.customerId,
                title: 'Request Resolved',
                body: `Your ${request.snapshotTitle} request ${request.requestNumber} is resolved. Please rate us!`,
                type: notification_model_1.NotificationType.RESOLUTION,
                entityId: request._id,
                entityType: 'ServiceRequest',
            });
        }
        catch (err) {
            console.warn('[RequestService] Notification delivery on resolution failed:', err);
        }
        return request;
    }
}
exports.RequestService = RequestService;
