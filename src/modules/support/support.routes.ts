import { Router } from 'express';
import { SupportController } from './support.controller';

const router = Router();

router.get('/info', SupportController.getSupportInfo);
router.get('/faqs', SupportController.getFaqs);

export default router;
