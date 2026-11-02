import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { ComplaintModel } from './complaint.model';
import { ServiceRequestModel } from '../requests/request.model';
import { UserModel } from '../users/user.model';
import { NotificationModel, NotificationType } from '../notifications/notification.model';
import { UserRole } from '../../shared/constants/roles';
import { sendSuccess, sendError } from '../../shared/utils/response';

export const CreateComplaintSchema = z.object({
  requestId: z.string().optional(),
  serviceTitle: z.string().optional(),
  issueCategory: z.string().optional(),
  description: z.string().min(3, 'Complaint description must be at least 3 characters').max(2000),
});

export class ComplaintController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { requestId, serviceTitle, issueCategory, description } = req.body;
      let requestObjId: Types.ObjectId | undefined;
      let requestNumber = 'General';
      let serviceSnapshot = serviceTitle || 'General Issue';

      if (requestId) {
        const request = await ServiceRequestModel.findById(requestId);
        if (request) {
          // If customer provided an order, verify ownership
          if (request.customerId.toString() !== req.user.id) {
            sendError(res, 'FORBIDDEN', 'You can only raise complaints for your own orders', 403);
            return;
          }
          requestObjId = request._id;
          requestNumber = request.requestNumber;
          serviceSnapshot = request.snapshotTitle;
        }
      }

      const complaint = await ComplaintModel.create({
        customerId: new Types.ObjectId(req.user.id),
        requestId: requestObjId,
        requestNumberSnapshot: requestNumber,
        serviceTitleSnapshot: serviceSnapshot,
        issueCategory,
        description,
      });

      // Notify Admins/Owners
      try {
        const owners = await UserModel.find({
          role: { $in: [UserRole.ADMIN, UserRole.OWNER] },
          isActive: true,
        });
        for (const owner of owners) {
          await NotificationModel.create({
            recipientUserId: owner._id,
            title: `Complaint: ${serviceSnapshot}`,
            body: `${req.user.name} reported an issue: "${description.slice(0, 80)}..."`,
            type: NotificationType.COMPLAINT,
            entityId: complaint._id,
            entityType: 'Complaint',
          });
        }
      } catch (err) {
        console.warn('[ComplaintController] Failed to notify owner:', err);
      }

      sendSuccess(res, complaint, 'Complaint submitted successfully', 201);
    } catch (err: any) {
      sendError(res, 'CREATE_COMPLAINT_FAILED', err.message, 500);
    }
  }

  static async getMyComplaints(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const complaints = await ComplaintModel.find({ customerId: new Types.ObjectId(req.user.id) })
        .sort({ createdAt: -1 })
        .lean();

      sendSuccess(res, complaints);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async getAllComplaints(_req: Request, res: Response): Promise<void> {
    try {
      const complaints = await ComplaintModel.find()
        .sort({ createdAt: -1 })
        .lean();

      sendSuccess(res, complaints);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }
}
