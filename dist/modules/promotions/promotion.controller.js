"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionController = void 0;
const promotion_model_1 = require("./promotion.model");
const response_1 = require("../../shared/utils/response");
class PromotionController {
    static async getPromotions(_req, res) {
        try {
            const promotions = await promotion_model_1.PromotionModel.find({ isActive: true })
                .sort({ createdAt: -1 })
                .lean();
            (0, response_1.sendSuccess)(res, promotions);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
}
exports.PromotionController = PromotionController;
