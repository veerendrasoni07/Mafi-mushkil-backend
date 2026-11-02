import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  AuthController,
  RegisterCustomerSchema,
  LoginSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  DemoLoginSchema,
} from './auth.controller';
import { validateBody } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Rate limiting for sensitive authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 min window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
});

// Public Customer Registration (Always creates CUSTOMER role)
router.post('/register', authLimiter, validateBody(RegisterCustomerSchema), AuthController.register);

// Common Unified Login for all roles
router.post('/login', authLimiter, validateBody(LoginSchema), AuthController.login);

// Authenticated Password Change (First login or normal)
router.post('/change-password', authenticate, validateBody(ChangePasswordSchema), AuthController.changePassword);

// Password Recovery
router.post('/forgot-password', authLimiter, validateBody(ForgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(ResetPasswordSchema), AuthController.resetPassword);

// User Session
router.get('/me', authenticate, AuthController.getMe);
router.post('/logout', authenticate, AuthController.logout);

// Development / Demo Login
router.post('/demo-login', validateBody(DemoLoginSchema), AuthController.demoLogin);

export default router;
