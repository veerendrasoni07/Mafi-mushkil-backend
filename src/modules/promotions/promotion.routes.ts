import { Router } from 'express';
import { PromotionController } from './promotion.controller';

const router = Router();

router.get('/', PromotionController.getPromotions);

export default router;
