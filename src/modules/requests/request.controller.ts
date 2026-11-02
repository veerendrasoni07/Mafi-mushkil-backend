import { Request, Response } from 'express';
import { z } from 'zod';
import { RequestService } from './request.service';
import { RequestStatus } from '../../shared/constants/status';
import { sendSuccess, sendError } from '../../shared/utils/response';

export const CreateRequestSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  problemDescription: z.string().min(3, 'Problem description must be at least 3 characters').max(2000),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500),
});

export const AssignEngineerSchema = z.object({
  engineerId: z.string().min(1, 'Engineer ID is required'),
});

export class RequestController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
      const request = await RequestService.createRequest({
        customerId: req.user.id,
        serviceId: req.body.serviceId,
        categoryId: req.body.categoryId,
        productId: req.body.productId,
        problemDescription: req.body.problemDescription,
        address: req.body.address,
        idempotencyKey,
      });

      sendSuccess(res, request, 'Request raised successfully', 201);
    } catch (err: any) {
      if (err.message === 'SERVICE_NOT_FOUND') {
        sendError(res, 'SERVICE_NOT_FOUND', 'The requested service was not found', 404);
        return;
      }
      sendError(res, 'CREATE_REQUEST_FAILED', err.message, 500);
    }
  }

  static async getMyRequests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const requests = await RequestService.getCustomerRequests(req.user.id);
      sendSuccess(res, requests);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const summary = await RequestService.getCustomerDashboardSummary(req.user.id);
      sendSuccess(res, summary);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as RequestStatus | undefined;
      const requests = await RequestService.getAllRequests(status);
      sendSuccess(res, requests);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async getOwnerSummary(_req: Request, res: Response): Promise<void> {
    try {
      const summary = await RequestService.getOwnerSummary();
      sendSuccess(res, summary);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async assignEngineer(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const id = req.params.id as string;
      const { engineerId } = req.body;

      const updated = await RequestService.assignEngineer(id, engineerId, req.user.id);
      sendSuccess(res, updated, 'Engineer assigned successfully');
    } catch (err: any) {
      if (err.message === 'ENGINEER_NOT_FOUND_OR_INACTIVE') {
        sendError(res, 'INVALID_ENGINEER', 'Engineer not found or is inactive', 404);
        return;
      }
      if (err.message === 'CANNOT_ASSIGN_RESOLVED_REQUEST') {
        sendError(res, 'CONFLICT', 'Cannot assign an engineer to an already resolved request', 409);
        return;
      }
      sendError(res, 'ASSIGN_FAILED', err.message, 500);
    }
  }

  static async resolve(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const id = req.params.id as string;
      const updated = await RequestService.resolveRequest(id, req.user.id);
      sendSuccess(res, updated, 'Task marked as resolved');
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED_ENGINEER') {
        sendError(res, 'FORBIDDEN', 'You are not assigned to resolve this task', 403);
        return;
      }
      if (err.message === 'INVALID_STATUS_TRANSITION') {
        sendError(res, 'BAD_REQUEST', 'Only ASSIGNED tasks can be marked resolved', 400);
        return;
      }
      sendError(res, 'RESOLVE_FAILED', err.message, 500);
    }
  }
}
