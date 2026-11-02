"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineerController = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../users/user.model");
const request_model_1 = require("../requests/request.model");
const roles_1 = require("../../shared/constants/roles");
const status_1 = require("../../shared/constants/status");
const response_1 = require("../../shared/utils/response");
class EngineerController {
    // For Owner: List all engineers and their workload
    static async getEngineers(_req, res) {
        try {
            const engineers = await user_model_1.UserModel.find({ role: roles_1.UserRole.ENGINEER, isActive: true })
                .sort({ name: 1 })
                .lean();
            const engineerIds = engineers.map((e) => e._id);
            // Aggregate active tasks count for each engineer
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
                return {
                    id: e._id,
                    name: e.name,
                    phone: e.phone,
                    avatarInitial: e.avatarInitial || e.name.charAt(0).toUpperCase(),
                    activeTasks,
                    status: activeTasks > 0 ? 'Busy' : 'Available',
                };
            });
            (0, response_1.sendSuccess)(res, formatted);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    // For Engineer: Get own assigned tasks
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
