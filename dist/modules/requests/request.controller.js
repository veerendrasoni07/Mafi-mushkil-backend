"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestController = exports.AssignEngineerSchema = exports.CreateRequestSchema = void 0;
const zod_1 = require("zod");
const request_service_1 = require("./request.service");
const response_1 = require("../../shared/utils/response");
exports.CreateRequestSchema = zod_1.z.object({
    serviceId: zod_1.z.string().min(1, 'Service ID is required'),
    categoryId: zod_1.z.string().optional(),
    subServiceId: zod_1.z.string().optional(),
    productId: zod_1.z.string().optional(),
    problemDescription: zod_1.z.string().min(3, 'Problem description must be at least 3 characters').max(2000),
    address: zod_1.z.string().min(5, 'Address must be at least 5 characters').max(500),
});
exports.AssignEngineerSchema = zod_1.z.object({
    engineerId: zod_1.z.string().min(1, 'Engineer ID is required'),
});
class RequestController {
    static async create(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const idempotencyKey = req.headers['idempotency-key'] || undefined;
            const targetCategoryId = req.body.categoryId || req.body.subServiceId;
            const request = await request_service_1.RequestService.createRequest({
                customerId: req.user.id,
                serviceId: req.body.serviceId,
                categoryId: targetCategoryId,
                productId: req.body.productId,
                problemDescription: req.body.problemDescription,
                address: req.body.address,
                idempotencyKey,
            });
            (0, response_1.sendSuccess)(res, request, 'Request raised successfully', 201);
        }
        catch (err) {
            if (err.message === 'SERVICE_NOT_FOUND') {
                (0, response_1.sendError)(res, 'SERVICE_NOT_FOUND', 'The requested service was not found', 404);
                return;
            }
            if (err.message === 'COMPLAINT_TYPE_NOT_ALLOWED_AS_SUB_SERVICE') {
                (0, response_1.sendError)(res, 'INVALID_SUB_SERVICE', 'Complaint types cannot be booked as regular sub-services. Please use the complaint registration workflow.', 400);
                return;
            }
            if (err.message === 'CATEGORY_NOT_FOUND') {
                (0, response_1.sendError)(res, 'CATEGORY_NOT_FOUND', 'The specified sub-service was not found', 404);
                return;
            }
            if (err.message === 'CATEGORY_SERVICE_MISMATCH') {
                (0, response_1.sendError)(res, 'SERVICE_MISMATCH', 'Selected sub-service does not belong to the selected service', 400);
                return;
            }
            if (err.message === 'INVALID_CATEGORY_ID') {
                (0, response_1.sendError)(res, 'INVALID_ID', 'Invalid sub-service ID format', 400);
                return;
            }
            (0, response_1.sendError)(res, 'CREATE_REQUEST_FAILED', err.message, 500);
        }
    }
    static async getMyRequests(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const requests = await request_service_1.RequestService.getCustomerRequests(req.user.id);
            (0, response_1.sendSuccess)(res, requests);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async getDashboardSummary(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const summary = await request_service_1.RequestService.getCustomerDashboardSummary(req.user.id);
            (0, response_1.sendSuccess)(res, summary);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async getAll(req, res) {
        try {
            const status = req.query.status;
            const requests = await request_service_1.RequestService.getAllRequests(status);
            (0, response_1.sendSuccess)(res, requests);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async getOwnerSummary(_req, res) {
        try {
            const summary = await request_service_1.RequestService.getOwnerSummary();
            (0, response_1.sendSuccess)(res, summary);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async assignEngineer(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const id = req.params.id;
            const { engineerId } = req.body;
            const updated = await request_service_1.RequestService.assignEngineer(id, engineerId, req.user.id);
            (0, response_1.sendSuccess)(res, updated, 'Engineer assigned successfully');
        }
        catch (err) {
            if (err.message === 'ENGINEER_NOT_FOUND_OR_INACTIVE') {
                (0, response_1.sendError)(res, 'INVALID_ENGINEER', 'Engineer not found or is inactive', 404);
                return;
            }
            if (err.message === 'CANNOT_ASSIGN_RESOLVED_REQUEST') {
                (0, response_1.sendError)(res, 'CONFLICT', 'Cannot assign an engineer to an already resolved request', 409);
                return;
            }
            (0, response_1.sendError)(res, 'ASSIGN_FAILED', err.message, 500);
        }
    }
    static async resolve(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const id = req.params.id;
            const updated = await request_service_1.RequestService.resolveRequest(id, req.user.id);
            (0, response_1.sendSuccess)(res, updated, 'Task marked as resolved');
        }
        catch (err) {
            if (err.message === 'UNAUTHORIZED_ENGINEER') {
                (0, response_1.sendError)(res, 'FORBIDDEN', 'You are not assigned to resolve this task', 403);
                return;
            }
            if (err.message === 'INVALID_STATUS_TRANSITION') {
                (0, response_1.sendError)(res, 'BAD_REQUEST', 'Only ASSIGNED tasks can be marked resolved', 400);
                return;
            }
            (0, response_1.sendError)(res, 'RESOLVE_FAILED', err.message, 500);
        }
    }
}
exports.RequestController = RequestController;
