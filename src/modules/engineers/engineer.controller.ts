import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { UserModel } from '../users/user.model';
import { ServiceRequestModel } from '../requests/request.model';
import { UserRole } from '../../shared/constants/roles';
import { RequestStatus } from '../../shared/constants/status';
import { sendSuccess, sendError } from '../../shared/utils/response';

export class EngineerController {
  // For Owner: List all engineers and their workload
  static async getEngineers(_req: Request, res: Response): Promise<void> {
    try {
      const engineers = await UserModel.find({ role: UserRole.ENGINEER, isActive: true })
        .sort({ name: 1 })
        .lean();

      const engineerIds = engineers.map((e) => e._id);

      // Aggregate active tasks count for each engineer
      const activeCounts = await ServiceRequestModel.aggregate([
        {
          $match: {
            assignedEngineerId: { $in: engineerIds },
            status: RequestStatus.ASSIGNED,
          },
        },
        {
          $group: {
            _id: '$assignedEngineerId',
            count: { $sum: 1 },
          },
        },
      ]);

      const countMap = new Map<string, number>();
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

      sendSuccess(res, formatted);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  // For Engineer: Get own assigned tasks
  static async getMyTasks(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const tasks = await ServiceRequestModel.find({
        assignedEngineerId: new Types.ObjectId(req.user.id),
      })
        .sort({ createdAt: -1 })
        .lean();

      sendSuccess(res, tasks);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }
}
