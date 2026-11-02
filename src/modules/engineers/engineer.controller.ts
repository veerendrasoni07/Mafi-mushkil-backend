import { Request, Response } from 'express';
import { Types } from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserModel } from '../users/user.model';
import { ServiceRequestModel } from '../requests/request.model';
import { UserRole } from '../../shared/constants/roles';
import { RequestStatus } from '../../shared/constants/status';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { EmailService, EmailResult } from '../../shared/services/email.service';

export const CreateEngineerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Valid email address is required').max(150),
  phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20).optional(),
});

export const UpdateEngineerStatusSchema = z.object({
  isActive: z.boolean(),
});

export class EngineerController {
  /**
   * For Admin/Owner: List all engineers with workload, account status, search & stats
   */
  static async getEngineers(req: Request, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string)?.trim();
      const query: any = {
        role: UserRole.ENGINEER,
      };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      const engineers = await UserModel.find(query)
        .sort({ createdAt: -1 })
        .lean();

      const engineerIds = engineers.map((e) => e._id);

      // Aggregate active tasks count
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
        let workloadStatus = 'Available';
        if (!e.isActive) {
          workloadStatus = 'Deactivated';
        } else if (activeTasks > 0) {
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

      sendSuccess(res, formatted);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  /**
   * For Admin: Create a new engineer account
   */
  static async createEngineer(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      // Check if email already registered
      const existing = await UserModel.findOne({ email: normalizedEmail });
      if (existing) {
        sendError(res, 'EMAIL_EXISTS', 'An account with this email address already exists.', 400);
        return;
      }

      // Generate cryptographically secure temporary password (e.g. "Eng#9b72a1")
      const randomHex = crypto.randomBytes(3).toString('hex');
      const temporaryPassword = `Eng#${randomHex}`;
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);

      const engineer = await UserModel.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || undefined,
        passwordHash,
        role: UserRole.ENGINEER,
        isActive: true,
        mustChangePassword: true, // Mandatory first login change
        avatarInitial: name.trim().charAt(0).toUpperCase(),
      });

      // Attempt email delivery
      const emailResult = await EmailService.sendEngineerWelcome({
        email: normalizedEmail,
        name: engineer.name,
        temporaryPassword,
      });

      const responsePayload: Record<string, any> = {
        engineer: engineer.toSafeUser(),
        emailDelivered: emailResult.delivered,
      };

      if (emailResult.delivered) {
        responsePayload.notice = `Engineer account created. Temporary credentials sent to ${normalizedEmail}.`;
      } else {
        // Fallback when SMTP is not configured
        responsePayload.notice = `Engineer account created. Email delivery not configured. Secure temporary password: ${temporaryPassword}`;
        responsePayload.temporaryPassword = temporaryPassword;
      }

      sendSuccess(res, responsePayload, 'Engineer account created successfully', 201);
    } catch (err: any) {
      sendError(res, 'CREATE_ENGINEER_FAILED', err.message || 'Failed to create engineer', 400);
    }
  }

  /**
   * For Admin: Get single engineer details
   */
  static async getEngineerDetails(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!Types.ObjectId.isValid(id)) {
        sendError(res, 'INVALID_ID', 'Invalid engineer ID', 400);
        return;
      }

      const engineer = await UserModel.findOne({ _id: id, role: UserRole.ENGINEER });
      if (!engineer) {
        sendError(res, 'NOT_FOUND', 'Engineer account not found', 404);
        return;
      }

      const activeTasks = await ServiceRequestModel.countDocuments({
        assignedEngineerId: engineer._id,
        status: RequestStatus.ASSIGNED,
      });

      sendSuccess(res, {
        engineer: engineer.toSafeUser(),
        activeTasks,
      });
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  /**
   * For Admin: Toggle engineer active/deactive status
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        sendError(res, 'INVALID_ID', 'Invalid engineer ID', 400);
        return;
      }

      const engineer = await UserModel.findOne({ _id: id, role: UserRole.ENGINEER });
      if (!engineer) {
        sendError(res, 'NOT_FOUND', 'Engineer not found', 404);
        return;
      }

      engineer.isActive = isActive;
      await engineer.save();

      sendSuccess(
        res,
        engineer.toSafeUser(),
        `Engineer account ${isActive ? 'activated' : 'deactivated'} successfully.`
      );
    } catch (err: any) {
      sendError(res, 'UPDATE_FAILED', err.message, 500);
    }
  }

  /**
   * For Admin: Reset engineer password
   */
  static async resetEngineerPassword(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!Types.ObjectId.isValid(id)) {
        sendError(res, 'INVALID_ID', 'Invalid engineer ID', 400);
        return;
      }

      const engineer = await UserModel.findOne({ _id: id, role: UserRole.ENGINEER });
      if (!engineer) {
        sendError(res, 'NOT_FOUND', 'Engineer not found', 404);
        return;
      }

      // Generate new temporary password
      const randomHex = crypto.randomBytes(3).toString('hex');
      const temporaryPassword = `Eng#${randomHex}`;
      engineer.passwordHash = await bcrypt.hash(temporaryPassword, 10);
      engineer.mustChangePassword = true;
      await engineer.save();

      let emailResult: EmailResult = { delivered: false, reason: 'No email address on profile' };
      if (engineer.email) {
        emailResult = await EmailService.sendEngineerWelcome({
          email: engineer.email,
          name: engineer.name,
          temporaryPassword,
        });
      }

      const responsePayload: Record<string, any> = {
        engineerId: engineer._id.toString(),
        emailDelivered: emailResult.delivered,
      };

      if (emailResult.delivered) {
        responsePayload.notice = `Password reset successfully and sent to ${engineer.email}.`;
      } else {
        responsePayload.notice = `Password reset. Email delivery unavailable. Temporary password: ${temporaryPassword}`;
        responsePayload.temporaryPassword = temporaryPassword;
      }

      sendSuccess(res, responsePayload, 'Engineer password reset successfully.');
    } catch (err: any) {
      sendError(res, 'RESET_FAILED', err.message, 500);
    }
  }

  /**
   * For Engineer: Get own assigned tasks
   */
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
