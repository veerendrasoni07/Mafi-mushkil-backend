import { Types } from 'mongoose';
import { ServiceRequestModel, IServiceRequest } from './request.model';
import { ServiceModel, CategoryModel, ProductModel, ComplaintTypeModel } from '../catalog/catalog.models';
import { UserModel } from '../users/user.model';
import { NotificationModel, NotificationType } from '../notifications/notification.model';
import { RequestStatus } from '../../shared/constants/status';
import { UserRole } from '../../shared/constants/roles';
import { generateNextRequestNumber } from '../../shared/utils/request-number';

export interface CreateRequestInput {
  customerId: string;
  serviceId: string;
  categoryId?: string;
  productId?: string;
  problemDescription: string;
  address: string;
  idempotencyKey?: string;
}

export class RequestService {
  static async createRequest(input: CreateRequestInput): Promise<IServiceRequest> {
    if (input.idempotencyKey) {
      const existing = await ServiceRequestModel.findOne({ idempotencyKey: input.idempotencyKey });
      if (existing) {
        return existing;
      }
    }

    const customer = await UserModel.findById(input.customerId);
    if (!customer) {
      throw new Error('CUSTOMER_NOT_FOUND');
    }

    const service = await ServiceModel.findById(input.serviceId);
    if (!service) {
      throw new Error('SERVICE_NOT_FOUND');
    }

    let snapshotTitle = service.title;
    let snapshotPriceMinorUnits: number | undefined;

    if (input.categoryId) {
      if (!Types.ObjectId.isValid(input.categoryId)) {
        throw new Error('INVALID_CATEGORY_ID');
      }

      // Ensure complaint types cannot accidentally be submitted as normal booking sub-services
      const complaintType = await ComplaintTypeModel.findById(input.categoryId);
      if (complaintType) {
        throw new Error('COMPLAINT_TYPE_NOT_ALLOWED_AS_SUB_SERVICE');
      }

      const category = await CategoryModel.findById(input.categoryId);
      if (!category) {
        throw new Error('CATEGORY_NOT_FOUND');
      }

      if (category.serviceId.toString() !== service._id.toString()) {
        throw new Error('CATEGORY_SERVICE_MISMATCH');
      }

      snapshotTitle = `${service.title} - ${category.title}`;
    }

    if (input.productId) {
      const product = await ProductModel.findById(input.productId);
      if (product) {
        snapshotTitle = `${service.title} - ${product.title}`;
        snapshotPriceMinorUnits = product.priceMinorUnits;
      }
    }

    const requestNumber = await generateNextRequestNumber();

    const request = await ServiceRequestModel.create({
      requestNumber,
      customerId: customer._id,
      customerNameSnapshot: customer.name,
      customerPhoneSnapshot: customer.phone,
      serviceId: service._id,
      categoryId: input.categoryId ? new Types.ObjectId(input.categoryId) : undefined,
      productId: input.productId ? new Types.ObjectId(input.productId) : undefined,
      snapshotTitle,
      snapshotPriceMinorUnits,
      problemDescription: input.problemDescription,
      address: input.address,
      status: RequestStatus.OPEN,
      idempotencyKey: input.idempotencyKey,
      statusHistory: [
        {
          status: RequestStatus.OPEN,
          changedBy: customer._id,
          changedAt: new Date(),
          note: 'Request created by customer',
        },
      ],
    });

    // Notify all admins/owners
    try {
      const owners = await UserModel.find({
        role: { $in: [UserRole.ADMIN, UserRole.OWNER] },
        isActive: true,
      });
      for (const owner of owners) {
        await NotificationModel.create({
          recipientUserId: owner._id,
          title: `New Request ${request.requestNumber}`,
          body: `${customer.name} raised a new request for ${snapshotTitle} at ${input.address}.`,
          type: NotificationType.SYSTEM,
          entityId: request._id,
          entityType: 'ServiceRequest',
        });
      }
    } catch (err) {
      console.warn('[RequestService] Notification delivery to owner failed:', err);
    }

    return request;
  }

  static async getCustomerRequests(customerId: string): Promise<any[]> {
    return ServiceRequestModel.find({ customerId: new Types.ObjectId(customerId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getCustomerDashboardSummary(customerId: string) {
    const custId = new Types.ObjectId(customerId);
    const [totalOrders, activeOrders, doneOrders, recentOrders] = await Promise.all([
      ServiceRequestModel.countDocuments({ customerId: custId }),
      ServiceRequestModel.countDocuments({
        customerId: custId,
        status: { $in: [RequestStatus.OPEN, RequestStatus.ASSIGNED] },
      }),
      ServiceRequestModel.countDocuments({ customerId: custId, status: RequestStatus.RESOLVED }),
      ServiceRequestModel.find({ customerId: custId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    return {
      totalOrders,
      activeOrders,
      doneOrders,
      recentOrders,
    };
  }

  static async getAllRequests(status?: RequestStatus): Promise<any[]> {
    const filter = status ? { status } : {};
    return ServiceRequestModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  static async getOwnerSummary() {
    const [newCount, activeCount, doneCount] = await Promise.all([
      ServiceRequestModel.countDocuments({ status: RequestStatus.OPEN }),
      ServiceRequestModel.countDocuments({ status: RequestStatus.ASSIGNED }),
      ServiceRequestModel.countDocuments({ status: RequestStatus.RESOLVED }),
    ]);

    return {
      newCount,
      activeCount,
      doneCount,
    };
  }

  static async assignEngineer(requestId: string, engineerId: string, ownerId: string): Promise<IServiceRequest> {
    const engineer = await UserModel.findOne({ _id: engineerId, role: UserRole.ENGINEER, isActive: true });
    if (!engineer) {
      throw new Error('ENGINEER_NOT_FOUND_OR_INACTIVE');
    }

    const request = await ServiceRequestModel.findById(requestId);
    if (!request) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    if (request.status === RequestStatus.RESOLVED) {
      throw new Error('CANNOT_ASSIGN_RESOLVED_REQUEST');
    }

    const previousEngineerName = request.assignedEngineerNameSnapshot;
    request.assignedEngineerId = engineer._id;
    request.assignedEngineerNameSnapshot = engineer.name;
    request.assignedAt = new Date();
    request.status = RequestStatus.ASSIGNED;
    request.statusHistory.push({
      status: RequestStatus.ASSIGNED,
      changedBy: new Types.ObjectId(ownerId),
      changedAt: new Date(),
      note: previousEngineerName
        ? `Reassigned from ${previousEngineerName} to ${engineer.name}`
        : `Assigned to ${engineer.name}`,
    });

    await request.save();

    // Notify Customer
    try {
      await NotificationModel.create({
        recipientUserId: request.customerId,
        title: 'Engineer Assigned',
        body: `${engineer.name} is assigned to your ${request.snapshotTitle} request.`,
        type: NotificationType.ASSIGNMENT,
        entityId: request._id,
        entityType: 'ServiceRequest',
      });

      // Notify Assigned Engineer
      await NotificationModel.create({
        recipientUserId: engineer._id,
        title: 'New Task Assigned',
        body: `You have been assigned to request ${request.requestNumber}: ${request.snapshotTitle}.`,
        type: NotificationType.ASSIGNMENT,
        entityId: request._id,
        entityType: 'ServiceRequest',
      });
    } catch (err) {
      console.warn('[RequestService] Notification delivery on assignment failed:', err);
    }

    return request;
  }

  static async resolveRequest(requestId: string, engineerId: string): Promise<IServiceRequest> {
    const request = await ServiceRequestModel.findById(requestId);
    if (!request) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    if (!request.assignedEngineerId || request.assignedEngineerId.toString() !== engineerId) {
      throw new Error('UNAUTHORIZED_ENGINEER');
    }

    if (request.status === RequestStatus.RESOLVED) {
      return request; // Idempotent resolution
    }

    if (request.status !== RequestStatus.ASSIGNED) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    request.status = RequestStatus.RESOLVED;
    request.resolvedAt = new Date();
    request.statusHistory.push({
      status: RequestStatus.RESOLVED,
      changedBy: new Types.ObjectId(engineerId),
      changedAt: new Date(),
      note: 'Marked resolved by assigned engineer',
    });

    await request.save();

    // Notify Customer
    try {
      await NotificationModel.create({
        recipientUserId: request.customerId,
        title: 'Request Resolved',
        body: `Your ${request.snapshotTitle} request ${request.requestNumber} is resolved. Please rate us!`,
        type: NotificationType.RESOLUTION,
        entityId: request._id,
        entityType: 'ServiceRequest',
      });
    } catch (err) {
      console.warn('[RequestService] Notification delivery on resolution failed:', err);
    }

    return request;
  }
}
