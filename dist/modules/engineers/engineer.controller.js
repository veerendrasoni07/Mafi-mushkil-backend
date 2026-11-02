"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineerController = exports.UpdateEngineerStatusSchema = exports.CreateEngineerSchema = void 0;
const mongoose_1 = require("mongoose");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const user_model_1 = require("../users/user.model");
const request_model_1 = require("../requests/request.model");
const roles_1 = require("../../shared/constants/roles");
const status_1 = require("../../shared/constants/status");
const response_1 = require("../../shared/utils/response");
const email_service_1 = require("../../shared/services/email.service");
exports.CreateEngineerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: zod_1.z.string().email('Valid email address is required').max(150),
    phone: zod_1.z.string().min(8, 'Phone number must be at least 8 digits').max(20).optional(),
});
exports.UpdateEngineerStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean(),
});
class EngineerController {
    /**
     * For Admin/Owner: List all engineers with workload, account status, search & stats
     */
    static async getEngineers(req, res) {
        try {
            const search = req.query.search?.trim();
            const query = {
                role: roles_1.UserRole.ENGINEER,
            };
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                ];
            }
            const engineers = await user_model_1.UserModel.find(query)
                .sort({ createdAt: -1 })
                .lean();
            const engineerIds = engineers.map((e) => e._id);
            // Aggregate active tasks count
            const activeCounts = await request_model_1.ServiceRequestModel.aggregate([
                {
                    $match: {
                        assignedEngineerId: { $in: engineerIds },
                        status: status_1.RequestStatus.ASSIGNED,
                    },
                },
                {
                    $group: {
                        _id: '$assignedEngineerId',
                        count: { $sum: 1 },
                    },
                },
            ]);
            const countMap = new Map();
            for (const item of activeCounts) {
                countMap.set(item._id.toString(), item.count);
            }
            const formatted = engineers.map((e) => {
                const activeTasks = countMap.get(e._id.toString()) || 0;
                let workloadStatus = 'Available';
                if (!e.isActive) {
                    workloadStatus = 'Deactivated';
                }
                else if (activeTasks > 0) {
                    workloadStatus = 'Busy';
                }
                return {
                    id: e._id.toString(),
                    name: e.name,
                    email: e.email || '',
                    phone: e.phone || '',
                    avatarInitial: e.avatarInitial || (e.name ? e.name.charAt(0).toUpperCase() : 'E'),
                    isActive: e.isActive,
                    mustChangePassword: e.mustChangePassword || false,
                    activeTasks,
                    status: workloadStatus,
                    createdAt: e.createdAt,
                    lastLoginAt: e.lastLoginAt || null,
                };
            });
            (0, response_1.sendSuccess)(res, formatted);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    /**
     * For Admin: Create a new engineer account
     */
    static async createEngineer(req, res) {
        try {
            const { name, email, phone } = req.body;
            const normalizedEmail = email.trim().toLowerCase();
            // Check if email already registered
            const existing = await user_model_1.UserModel.findOne({ email: normalizedEmail });
            if (existing) {
                (0, response_1.sendError)(res, 'EMAIL_EXISTS', 'An account with this email address already exists.', 400);
                return;
            }
            // Generate cryptographically secure temporary password (e.g. "Eng#9b72a1")
            const randomHex = crypto_1.default.randomBytes(3).toString('hex');
            const temporaryPassword = `Eng#${randomHex}`;
            const passwordHash = await bcryptjs_1.default.hash(temporaryPassword, 10);
            const engineer = await user_model_1.UserModel.create({
                name: name.trim(),
                email: normalizedEmail,
                phone: phone?.trim() || undefined,
                passwordHash,
                role: roles_1.UserRole.ENGINEER,
                isActive: true,
                mustChangePassword: true, // Mandatory first login change
                avatarInitial: name.trim().charAt(0).toUpperCase(),
            });
            // Attempt email delivery
            const emailResult = await email_service_1.EmailService.sendEngineerWelcome({
                email: normalizedEmail,
                name: engineer.name,
                temporaryPassword,
            });
            const responsePayload = {
                engineer: engineer.toSafeUser(),
                emailDelivered: emailResult.delivered,
            };
            if (emailResult.delivered) {
                responsePayload.notice = `Engineer account created. Temporary credentials sent to ${normalizedEmail}.`;
            }
            else {
                // Fallback when SMTP is not configured
                responsePayload.notice = `Engineer account created. Email delivery not configured. Secure temporary password: ${temporaryPassword}`;
                responsePayload.temporaryPassword = temporaryPassword;
            }
            (0, response_1.sendSuccess)(res, responsePayload, 'Engineer account created successfully', 201);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'CREATE_ENGINEER_FAILED', err.message || 'Failed to create engineer', 400);
        }
    }
    /**
     * For Admin: Get single engineer details
     */
    static async getEngineerDetails(req, res) {
        try {
            const id = req.params.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                (0, response_1.sendError)(res, 'INVALID_ID', 'Invalid engineer ID', 400);
                return;
            }
            const engineer = await user_model_1.UserModel.findOne({ _id: id, role: roles_1.UserRole.ENGINEER });
            if (!engineer) {
                (0, response_1.sendError)(res, 'NOT_FOUND', 'Engineer account not found', 404);
                return;
            }
            const activeTasks = await request_model_1.ServiceRequestModel.countDocuments({
                assignedEngineerId: engineer._id,
                status: status_1.RequestStatus.ASSIGNED,
            });
            (0, response_1.sendSuccess)(res, {
                engineer: engineer.toSafeUser(),
                activeTasks,
            });
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    /**
     * For Admin: Toggle engineer active/deactive status
     */
    static async updateStatus(req, res) {
        try {
            const id = req.params.id;
            const { isActive } = req.body;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                (0, response_1.sendError)(res, 'INVALID_ID', 'Invalid engineer ID', 400);
                return;
            }
            const engineer = await user_model_1.UserModel.findOne({ _id: id, role: roles_1.UserRole.ENGINEER });
            if (!engineer) {
                (0, response_1.sendError)(res, 'NOT_FOUND', 'Engineer not found', 404);
                return;
            }
            engineer.isActive = isActive;
            await engineer.save();
            (0, response_1.sendSuccess)(res, engineer.toSafeUser(), `Engineer account ${isActive ? 'activated' : 'deactivated'} successfully.`);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'UPDATE_FAILED', err.message, 500);
        }
    }
    /**
     * For Admin: Reset engineer password
     */
    static async resetEngineerPassword(req, res) {
        try {
            const id = req.params.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                (0, response_1.sendError)(res, 'INVALID_ID', 'Invalid engineer ID', 400);
                return;
            }
            const engineer = await user_model_1.UserModel.findOne({ _id: id, role: roles_1.UserRole.ENGINEER });
            if (!engineer) {
                (0, response_1.sendError)(res, 'NOT_FOUND', 'Engineer not found', 404);
                return;
            }
            // Generate new temporary password
            const randomHex = crypto_1.default.randomBytes(3).toString('hex');
            const temporaryPassword = `Eng#${randomHex}`;
            engineer.passwordHash = await bcryptjs_1.default.hash(temporaryPassword, 10);
            engineer.mustChangePassword = true;
            await engineer.save();
            let emailResult = { delivered: false, reason: 'No email address on profile' };
            if (engineer.email) {
                emailResult = await email_service_1.EmailService.sendEngineerWelcome({
                    email: engineer.email,
                    name: engineer.name,
                    temporaryPassword,
                });
            }
            const responsePayload = {
                engineerId: engineer._id.toString(),
                emailDelivered: emailResult.delivered,
            };
            if (emailResult.delivered) {
                responsePayload.notice = `Password reset successfully and sent to ${engineer.email}.`;
            }
            else {
                responsePayload.notice = `Password reset. Email delivery unavailable. Temporary password: ${temporaryPassword}`;
                responsePayload.temporaryPassword = temporaryPassword;
            }
            (0, response_1.sendSuccess)(res, responsePayload, 'Engineer password reset successfully.');
        }
        catch (err) {
            (0, response_1.sendError)(res, 'RESET_FAILED', err.message, 500);
        }
    }
    /**
     * For Engineer: Get own assigned tasks
     */
    static async getMyTasks(req, res) {
        try {
            if (!req.user) {
                (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
                return;
            }
            const tasks = await request_model_1.ServiceRequestModel.find({
                assignedEngineerId: new mongoose_1.Types.ObjectId(req.user.id),
            })
                .sort({ createdAt: -1 })
                .lean();
            (0, response_1.sendSuccess)(res, tasks);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
}
exports.EngineerController = EngineerController;
