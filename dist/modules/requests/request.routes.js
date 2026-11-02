"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const request_controller_1 = require("./request.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const roles_1 = require("../../shared/constants/roles");
const router = (0, express_1.Router)();
// Customer endpoints
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.CUSTOMER), (0, validate_middleware_1.validateBody)(request_controller_1.CreateRequestSchema), request_controller_1.RequestController.create);
router.get('/my', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.CUSTOMER), request_controller_1.RequestController.getMyRequests);
router.get('/dashboard-summary', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.CUSTOMER), request_controller_1.RequestController.getDashboardSummary);
// Admin / Owner endpoints
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER), request_controller_1.RequestController.getAll);
router.get('/owner-summary', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER), request_controller_1.RequestController.getOwnerSummary);
router.post('/:id/assign', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER), (0, validate_middleware_1.validateBody)(request_controller_1.AssignEngineerSchema), request_controller_1.RequestController.assignEngineer);
// Engineer endpoints (Blocked if mandatory password change is pending)
router.post('/:id/resolve', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ENGINEER), auth_middleware_1.requirePasswordChanged, request_controller_1.RequestController.resolve);
exports.default = router;
