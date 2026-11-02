import mongoose, { Document, Schema, Types } from 'mongoose';
import { ComplaintStatus } from '../../shared/constants/status';

export interface IComplaint extends Document {
  customerId: Types.ObjectId;
  requestId: Types.ObjectId;
  requestNumberSnapshot: string;
  serviceTitleSnapshot: string;
  description: string;
  status: ComplaintStatus;
  ownerResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, index: true },
    requestNumberSnapshot: { type: String, required: true },
    serviceTitleSnapshot: { type: String, required: true },
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
ComplaintSchema.index({ status: 1, createdAt: -1 });

export const ComplaintModel = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
