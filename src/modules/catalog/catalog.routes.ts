import { Router } from 'express';
import {
  CatalogController,
  CreateServiceSchema,
  UpdateServiceSchema,
  UpdateStatusSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CreateComplaintTypeSchema,
  UpdateComplaintTypeSchema,
} from './catalog.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { UserRole } from '../../shared/constants/roles';

const router = Router();

// --- Public Endpoints ---
router.get('/services', CatalogController.getServices);
router.get('/services/:serviceId/categories', CatalogController.getCategoriesByService);
router.get('/services/:serviceId/complaint-types', CatalogController.getComplaintTypesByService);
router.get('/categories/:categoryId/products', CatalogController.getProductsByCategory);
router.get('/search', CatalogController.search);

// --- Admin Endpoints (Admin & Owner) ---
const adminAuth = [authenticate, authorizeRoles(UserRole.ADMIN, UserRole.OWNER)];

// Services CRUD
router.get('/admin/services', adminAuth, CatalogController.adminGetServices);
router.post('/admin/services', adminAuth, validateBody(CreateServiceSchema), CatalogController.adminCreateService);
router.put('/admin/services/:id', adminAuth, validateBody(UpdateServiceSchema), CatalogController.adminUpdateService);
router.patch('/admin/services/:id/status', adminAuth, validateBody(UpdateStatusSchema), CatalogController.adminUpdateServiceStatus);

// Sub-services (Categories) CRUD
router.get('/admin/services/:serviceId/categories', adminAuth, CatalogController.adminGetCategories);
router.post('/admin/services/:serviceId/categories', adminAuth, validateBody(CreateCategorySchema), CatalogController.adminCreateCategory);
router.put('/admin/categories/:id', adminAuth, validateBody(UpdateCategorySchema), CatalogController.adminUpdateCategory);
router.patch('/admin/categories/:id/status', adminAuth, validateBody(UpdateStatusSchema), CatalogController.adminUpdateCategoryStatus);

// Complaint Types CRUD
router.get('/admin/services/:serviceId/complaint-types', adminAuth, CatalogController.adminGetComplaintTypes);
router.post('/admin/services/:serviceId/complaint-types', adminAuth, validateBody(CreateComplaintTypeSchema), CatalogController.adminCreateComplaintType);
router.put('/admin/complaint-types/:id', adminAuth, validateBody(UpdateComplaintTypeSchema), CatalogController.adminUpdateComplaintType);
router.patch('/admin/complaint-types/:id/status', adminAuth, validateBody(UpdateStatusSchema), CatalogController.adminUpdateComplaintTypeStatus);

export default router;
