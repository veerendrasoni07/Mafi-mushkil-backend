import { Router } from 'express';
import {
  RequestController,
  CreateRequestSchema,
  AssignEngineerSchema,
} from './request.controller';
import { authenticate, requirePasswordChanged } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { UserRole } from '../../shared/constants/roles';

const router = Router();

// Customer endpoints
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.CUSTOMER),
  validateBody(CreateRequestSchema),
  RequestController.create
);
router.get(
  '/my',
  authenticate,
  authorizeRoles(UserRole.CUSTOMER),
  RequestController.getMyRequests
);
router.get(
  '/dashboard-summary',
  authenticate,
  authorizeRoles(UserRole.CUSTOMER),
  RequestController.getDashboardSummary
);

// Admin / Owner endpoints
router.get(
  '/',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.OWNER),
  RequestController.getAll
);
router.get(
  '/owner-summary',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.OWNER),
  RequestController.getOwnerSummary
);
router.post(
  '/:id/assign',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.OWNER),
  validateBody(AssignEngineerSchema),
  RequestController.assignEngineer
);

// Engineer endpoints (Blocked if mandatory password change is pending)
router.post(
  '/:id/resolve',
  authenticate,
  authorizeRoles(UserRole.ENGINEER),
  requirePasswordChanged,
  RequestController.resolve
);

export default router;
