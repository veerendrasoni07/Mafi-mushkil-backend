"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = exports.CategoryModel = exports.ServiceModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ServiceSchema = new mongoose_1.Schema({
    title: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    iconKey: { type: String, required: true, default: 'build' },
    sortOrder: { type: Number, default: 0 },
    complaintIssues: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
ServiceSchema.index({ isActive: 1, sortOrder: 1 });
exports.ServiceModel = mongoose_1.default.model('Service', ServiceSchema);
const CategorySchema = new mongoose_1.Schema({
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    iconKey: { type: String, default: 'videocam' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
CategorySchema.index({ serviceId: 1, isActive: 1, sortOrder: 1 });
exports.CategoryModel = mongoose_1.default.model('Category', CategorySchema);
const ProductSchema = new mongoose_1.Schema({
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priceMinorUnits: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    imageKey: { type: String, default: 'camera' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
ProductSchema.index({ categoryId: 1, isActive: 1, sortOrder: 1 });
ProductSchema.index({ serviceId: 1, isActive: 1 });
exports.ProductModel = mongoose_1.default.model('Product', ProductSchema);
