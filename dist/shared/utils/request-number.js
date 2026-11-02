"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNextRequestNumber = generateNextRequestNumber;
const request_model_1 = require("../../modules/requests/request.model");
async function generateNextRequestNumber() {
    const latest = await request_model_1.ServiceRequestModel.findOne({}, { requestNumber: 1 })
        .sort({ createdAt: -1 })
        .lean();
    if (!latest || !latest.requestNumber) {
        return '#101';
    }
    const match = latest.requestNumber.replace('#', '').trim();
    const num = parseInt(match, 10);
    if (isNaN(num)) {
        return `#${Date.now().toString().slice(-4)}`;
    }
    const next = num + 1;
    return `#${next.toString().padStart(3, '0')}`;
}
