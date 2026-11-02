import { Router } from 'express';
import {
  EngineerController,
  CreateEngineerSchema,
  UpdateEngineerStatusSchema,
} from './engineer.controller';
import { authenticate, requirePasswordChanged } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { UserRole } from '../../shared/constants/roles';

const router = Router();

// ==========================================
// Engineer Endpoints (SPECIFIC PATHS FIRST)
// ==========================================

// Get own assigned tasks (Blocked if mandatory password change is pending)
router.get(
  '/my-tasks',
  authenticate,
  authorizeRoles(UserRole.ENGINEER),
  requirePasswordChanged,
  EngineerController.getMyTasks
);

// ==========================================
// Admin / Owner Endpoints
// ==========================================

// List all engineers with workload & status
router.get(
  '/',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.OWNER),
  EngineerController.getEngineers
);

// Create new engineer account
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.OWNER),
  validateBody(CreateEngineerSchema),
  EngineerController.createEngineer
);

// Get engineer details (PARAMETERIZED PATH AFTER SPECIFIC PATHS)
router.get(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.OWNER),
  EngineerController.getEngineerDetails
);

// Activate / Deactivate engineer
router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.OWNER),
  validateBody(UpdateEngineerStatusSchema),
  EngineerController.updateStatus
);

// Admin reset engineer password
router.post(
  '/:id/reset-password',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.OWNER),
  EngineerController.resetEngineerPassword
);

export default router;
