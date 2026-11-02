import mongoose, { Document, Schema, Types } from 'mongoose';

// --- SERVICE ---
export interface IService extends Document {
  title: string;
  slug: string;
  iconKey: string;
  sortOrder: number;
  complaintIssues: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    iconKey: { type: String, required: true, default: 'build' },
    sortOrder: { type: Number, default: 0 },
    complaintIssues: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ServiceSchema.index({ isActive: 1, sortOrder: 1 });
export const ServiceModel = mongoose.model<IService>('Service', ServiceSchema);

// --- CATEGORY ---
export interface ICategory extends Document {
  serviceId: Types.ObjectId;
  title: string;
  slug: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    iconKey: { type: String, default: 'videocam' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ serviceId: 1, isActive: 1, sortOrder: 1 });
export const CategoryModel = mongoose.model<ICategory>('Category', CategorySchema);

// --- PRODUCT ---
export interface IProduct extends Document {
  serviceId: Types.ObjectId;
  categoryId: Types.ObjectId;
  title: string;
  description: string;
  priceMinorUnits: number; // in paise: 149900 = Rs. 1,499
  currency: string;
  imageKey: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priceMinorUnits: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    imageKey: { type: String, default: 'camera' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ categoryId: 1, isActive: 1, sortOrder: 1 });
ProductSchema.index({ serviceId: 1, isActive: 1 });

export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
