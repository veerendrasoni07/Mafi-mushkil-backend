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
exports.ServiceRequestModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const status_1 = require("../../shared/constants/status");
const StatusHistorySchema = new mongoose_1.Schema({
    status: { type: String, enum: Object.values(status_1.RequestStatus), required: true },
    changedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String },
}, { _id: false });
const ServiceRequestSchema = new mongoose_1.Schema({
    requestNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerNameSnapshot: { type: String, required: true },
    customerPhoneSnapshot: { type: String, required: true },
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: true },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' },
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' },
    snapshotTitle: { type: String, required: true },
    snapshotPriceMinorUnits: { type: Number },
    problemDescription: { type: String, required: true, maxlength: 2000 },
    address: { type: String, required: true, maxlength: 500 },
    status: {
        type: String,
        enum: Object.values(status_1.RequestStatus),
        default: status_1.RequestStatus.OPEN,
        required: true,
        index: true,
    },
    assignedEngineerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    assignedEngineerNameSnapshot: { type: String },
    assignedAt: { type: Date },
    resolvedAt: { type: Date },
    idempotencyKey: { type: String, sparse: true, index: true },
    statusHistory: [StatusHistorySchema],
}, { timestamps: true });
ServiceRequestSchema.index({ customerId: 1, createdAt: -1 });
ServiceRequestSchema.index({ status: 1, createdAt: -1 });
ServiceRequestSchema.index({ assignedEngineerId: 1, status: 1, createdAt: -1 });
exports.ServiceRequestModel = mongoose_1.default.model('ServiceRequest', ServiceRequestSchema);
