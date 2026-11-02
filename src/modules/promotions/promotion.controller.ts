import { Request, Response } from 'express';
import { PromotionModel } from './promotion.model';
import { sendSuccess, sendError } from '../../shared/utils/response';

export class PromotionController {
  static async getPromotions(_req: Request, res: Response): Promise<void> {
    try {
      const promotions = await PromotionModel.find({ isActive: true })
        .sort({ createdAt: -1 })
        .lean();

      sendSuccess(res, promotions);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }
}
