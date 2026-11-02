import { Router } from 'express';
import {
  ComplaintController,
  CreateComplaintSchema,
} from './complaint.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { UserRole } from '../../shared/constants/roles';

const router = Router();

// Customer creates complaint
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.CUSTOMER),
  validateBody(CreateComplaintSchema),
  ComplaintController.create
);

// Customer lists own complaints
router.get(
  '/my',
  authenticate,
  authorizeRoles(UserRole.CUSTOMER),
  ComplaintController.getMyComplaints
);

// Owner lists all complaints
router.get(
  '/',
  authenticate,
  authorizeRoles(UserRole.OWNER),
  ComplaintController.getAllComplaints
);

export default router;
