import { Router } from 'express';
import {
  RequestController,
  CreateRequestSchema,
  AssignEngineerSchema,
} from './request.controller';
import { authenticate } from '../../middleware/auth.middleware';
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

// Owner endpoints
router.get(
  '/',
  authenticate,
  authorizeRoles(UserRole.OWNER),
  RequestController.getAll
);
router.get(
  '/owner-summary',
  authenticate,
  authorizeRoles(UserRole.OWNER),
  RequestController.getOwnerSummary
);
router.post(
  '/:id/assign',
  authenticate,
  authorizeRoles(UserRole.OWNER),
  validateBody(AssignEngineerSchema),
  RequestController.assignEngineer
);

// Engineer endpoints
router.post(
  '/:id/resolve',
  authenticate,
  authorizeRoles(UserRole.ENGINEER),
  RequestController.resolve
);

export default router;
