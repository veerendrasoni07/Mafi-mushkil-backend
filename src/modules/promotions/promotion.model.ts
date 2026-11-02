import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotion extends Document {
  title: string;
  description: string;
  discountPercentage?: number;
  serviceSlug?: string;
  isActive: boolean;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    discountPercentage: { type: Number },
    serviceSlug: { type: String },
    isActive: { type: Boolean, default: true },
    validUntil: { type: Date },
  },
  { timestamps: true }
);

PromotionSchema.index({ isActive: 1, createdAt: -1 });

export const PromotionModel = mongoose.model<IPromotion>('Promotion', PromotionSchema);
