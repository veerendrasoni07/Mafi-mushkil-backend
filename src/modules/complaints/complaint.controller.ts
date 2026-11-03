import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { ComplaintModel } from './complaint.model';
import { ServiceRequestModel } from '../requests/request.model';
import { ServiceModel, CategoryModel, ComplaintTypeModel } from '../catalog/catalog.models';
import { UserModel } from '../users/user.model';
import { NotificationModel, NotificationType } from '../notifications/notification.model';
import { UserRole } from '../../shared/constants/roles';
import { sendSuccess, sendError } from '../../shared/utils/response';

export const CreateComplaintSchema = z.object({
  requestId: z.string().optional(),
  serviceId: z.string().optional(),
  complaintTypeId: z.string().optional(),
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

      const { requestId, serviceId, complaintTypeId, serviceTitle, issueCategory, description } = req.body;
      let requestObjId: Types.ObjectId | undefined;
      let serviceObjId: Types.ObjectId | undefined;
      let complaintTypeObjId: Types.ObjectId | undefined;
      let requestNumber = 'General';
      let serviceSnapshot = serviceTitle || 'General Issue';
      let finalIssueCategory = issueCategory;

      // 1. Guard against sub-services being submitted as complaint types
      if (complaintTypeId) {
        if (!Types.ObjectId.isValid(complaintTypeId)) {
          sendError(res, 'INVALID_COMPLAINT_TYPE_ID', 'Invalid complaint type ID format', 400);
          return;
        }

        const categoryAsSubService = await CategoryModel.findById(complaintTypeId);
        if (categoryAsSubService) {
          sendError(
            res,
            'INVALID_COMPLAINT_TYPE',
            'Sub-services cannot be submitted as complaint types. Please select a valid complaint type.',
            400
          );
          return;
        }

        const complaintType = await ComplaintTypeModel.findById(complaintTypeId);
        if (!complaintType) {
          sendError(res, 'COMPLAINT_TYPE_NOT_FOUND', 'The specified complaint type was not found', 404);
          return;
        }

        complaintTypeObjId = complaintType._id as Types.ObjectId;
        if (!finalIssueCategory) {
          finalIssueCategory = complaintType.title;
        }

        if (serviceId) {
          if (complaintType.serviceId.toString() !== serviceId) {
            sendError(
              res,
              'SERVICE_MISMATCH',
              'The selected complaint type does not belong to the selected service',
              400
            );
            return;
          }
        } else {
          serviceObjId = complaintType.serviceId as Types.ObjectId;
          const parentService = await ServiceModel.findById(complaintType.serviceId);
          if (parentService) {
            serviceSnapshot = parentService.title;
          }
        }
      }

      // 2. Resolve service if serviceId provided
      if (serviceId) {
        if (!Types.ObjectId.isValid(serviceId)) {
          sendError(res, 'INVALID_SERVICE_ID', 'Invalid service ID format', 400);
          return;
        }
        const service = await ServiceModel.findById(serviceId);
        if (!service) {
          sendError(res, 'SERVICE_NOT_FOUND', 'The specified service was not found', 404);
          return;
        }
        serviceObjId = service._id as Types.ObjectId;
        serviceSnapshot = service.title;
      }

      // 3. Resolve request if requestId provided
      if (requestId) {
        const request = await ServiceRequestModel.findById(requestId);
        if (request) {
          if (request.customerId.toString() !== req.user.id) {
            sendError(res, 'FORBIDDEN', 'You can only raise complaints for your own orders', 403);
            return;
          }
          requestObjId = request._id as Types.ObjectId;
          requestNumber = request.requestNumber;
          if (!serviceSnapshot || serviceSnapshot === 'General Issue') {
            serviceSnapshot = request.snapshotTitle;
          }
          if (!serviceObjId) {
            serviceObjId = request.serviceId as Types.ObjectId;
          }
        }
      }

      const complaint = await ComplaintModel.create({
        customerId: new Types.ObjectId(req.user.id),
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
