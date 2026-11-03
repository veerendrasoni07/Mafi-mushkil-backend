"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catalog_controller_1 = require("./catalog.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const roles_1 = require("../../shared/constants/roles");
const router = (0, express_1.Router)();
// --- Public Endpoints ---
router.get('/services', catalog_controller_1.CatalogController.getServices);
router.get('/services/:serviceId/categories', catalog_controller_1.CatalogController.getCategoriesByService);
router.get('/services/:serviceId/complaint-types', catalog_controller_1.CatalogController.getComplaintTypesByService);
router.get('/categories/:categoryId/products', catalog_controller_1.CatalogController.getProductsByCategory);
router.get('/search', catalog_controller_1.CatalogController.search);
// --- Admin Endpoints (Admin & Owner) ---
const adminAuth = [auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER)];
// Services CRUD
router.get('/admin/services', adminAuth, catalog_controller_1.CatalogController.adminGetServices);
router.post('/admin/services', adminAuth, (0, validate_middleware_1.validateBody)(catalog_controller_1.CreateServiceSchema), catalog_controller_1.CatalogController.adminCreateService);
router.put('/admin/services/:id', adminAuth, (0, validate_middleware_1.validateBody)(catalog_controller_1.UpdateServiceSchema), catalog_controller_1.CatalogController.adminUpdateService);
router.patch('/admin/services/:id/status', adminAuth, (0, validate_middleware_1.validateBody)(catalog_controller_1.UpdateStatusSchema), catalog_controller_1.CatalogController.adminUpdateServiceStatus);
// Sub-services (Categories) CRUD
router.get('/admin/services/:serviceId/categories', adminAuth, catalog_controller_1.CatalogController.adminGetCategories);
router.post('/admin/services/:serviceId/categories', adminAuth, (0, validate_middleware_1.validateBody)(catalog_controller_1.CreateCategorySchema), catalog_controller_1.CatalogController.adminCreateCategory);
router.put('/admin/categories/:id', adminAuth, (0, validate_middleware_1.validateBody)(catalog_controller_1.UpdateCategorySchema), catalog_controller_1.CatalogController.adminUpdateCategory);
router.patch('/admin/categories/:id/status', adminAuth, (0, validate_middleware_1.validateBody)(catalog_controller_1.UpdateStatusSchema), catalog_controller_1.CatalogController.adminUpdateCategoryStatus);
// Complaint Types CRUD
router.get('/admin/services/:serviceId/complaint-types', adminAuth, catalog_controller_1.CatalogController.adminGetComplaintTypes);
router.post('/admin/services/:serviceId/complaint-types', adminAuth, (0, validate_middleware_1.validateBody)(catalog_controller_1.CreateComplaintTypeSchema), catalog_controller_1.CatalogController.adminCreateComplaintType);
router.put('/admin/complaint-types/:id', adminAuth, (0, validate_middleware_1.validateBody)(catalog_controller_1.UpdateComplaintTypeSchema), catalog_controller_1.CatalogController.adminUpdateComplaintType);
router.patch('/admin/complaint-types/:id/status', adminAuth, (0, validate_middleware_1.validateBody)(catalog_controller_1.UpdateStatusSchema), catalog_controller_1.CatalogController.adminUpdateComplaintTypeStatus);
exports.default = router;
