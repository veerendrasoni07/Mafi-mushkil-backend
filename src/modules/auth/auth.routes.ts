import { Router } from 'express';
import {
  AuthController,
  DemoLoginSchema,
  RequestOtpSchema,
  VerifyOtpSchema,
} from './auth.controller';
import { validateBody } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/demo-login', validateBody(DemoLoginSchema), AuthController.demoLogin);
router.post('/request-otp', validateBody(RequestOtpSchema), AuthController.requestOtp);
router.post('/verify-otp', validateBody(VerifyOtpSchema), AuthController.verifyOtp);
router.get('/me', authenticate, AuthController.getMe);
router.post('/logout', authenticate, AuthController.logout);

export default router;
