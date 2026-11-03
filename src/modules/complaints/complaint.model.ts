import mongoose, { Document, Schema, Types } from 'mongoose';
import { ComplaintStatus } from '../../shared/constants/status';

export interface IComplaint extends Document {
  customerId: Types.ObjectId;
  serviceId?: Types.ObjectId;
  complaintTypeId?: Types.ObjectId;
  requestId?: Types.ObjectId;
  requestNumberSnapshot: string;
  serviceTitleSnapshot: string;
  issueCategory?: string;
  description: string;
  status: ComplaintStatus;
  ownerResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: false, index: true },
    complaintTypeId: { type: Schema.Types.ObjectId, ref: 'ComplaintType', required: false, index: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: false, index: true },
    requestNumberSnapshot: { type: String, default: 'General' },
    serviceTitleSnapshot: { type: String, required: true },
    issueCategory: { type: String },
    description: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.OPEN,
      required: true,
    },
    ownerResponse: { type: String },
  },
  { timestamps: true }
);

ComplaintSchema.index({ customerId: 1, createdAt: -1 });
ComplaintSchema.index({ serviceId: 1, createdAt: -1 });
ComplaintSchema.index({ complaintTypeId: 1, createdAt: -1 });
ComplaintSchema.index({ status: 1, createdAt: -1 });

export const ComplaintModel = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
