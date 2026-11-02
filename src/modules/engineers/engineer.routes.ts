import { Router } from 'express';
import { EngineerController } from './engineer.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { UserRole } from '../../shared/constants/roles';

const router = Router();

// Owner endpoint: list team with availability
router.get(
  '/',
  authenticate,
  authorizeRoles(UserRole.OWNER),
  EngineerController.getEngineers
);

// Engineer endpoint: get assigned tasks
router.get(
  '/my-tasks',
  authenticate,
  authorizeRoles(UserRole.ENGINEER),
  EngineerController.getMyTasks
);

export default router;
