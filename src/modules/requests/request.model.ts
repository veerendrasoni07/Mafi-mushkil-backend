import mongoose, { Document, Schema, Types } from 'mongoose';
import { RequestStatus } from '../../shared/constants/status';

export interface IStatusHistoryItem {
  status: RequestStatus;
  changedBy: Types.ObjectId;
  changedAt: Date;
  note?: string;
}

export interface IServiceRequest extends Document {
  requestNumber: string;
  customerId: Types.ObjectId;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string;
  serviceId: Types.ObjectId;
  categoryId?: Types.ObjectId;
  productId?: Types.ObjectId;
  snapshotTitle: string;
  snapshotPriceMinorUnits?: number;
  problemDescription: string;
  address: string;
  status: RequestStatus;
  assignedEngineerId?: Types.ObjectId;
  assignedEngineerNameSnapshot?: string;
  assignedAt?: Date;
  resolvedAt?: Date;
  idempotencyKey?: string;
  statusHistory: IStatusHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema<IStatusHistoryItem>(
  {
    status: { type: String, enum: Object.values(RequestStatus), required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    requestNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerNameSnapshot: { type: String, required: true },
    customerPhoneSnapshot: { type: String, required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    snapshotTitle: { type: String, required: true },
    snapshotPriceMinorUnits: { type: Number },
    problemDescription: { type: String, required: true, maxlength: 2000 },
    address: { type: String, required: true, maxlength: 500 },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.OPEN,
      required: true,
      index: true,
    },
    assignedEngineerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedEngineerNameSnapshot: { type: String },
    assignedAt: { type: Date },
    resolvedAt: { type: Date },
    idempotencyKey: { type: String, sparse: true, index: true },
    statusHistory: [StatusHistorySchema],
  },
  { timestamps: true }
);

ServiceRequestSchema.index({ customerId: 1, createdAt: -1 });
ServiceRequestSchema.index({ status: 1, createdAt: -1 });
ServiceRequestSchema.index({ assignedEngineerId: 1, status: 1, createdAt: -1 });

export const ServiceRequestModel = mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);
