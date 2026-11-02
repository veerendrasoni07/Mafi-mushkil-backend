"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const engineer_controller_1 = require("./engineer.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const roles_1 = require("../../shared/constants/roles");
const router = (0, express_1.Router)();
// ==========================================
// Engineer Endpoints (SPECIFIC PATHS FIRST)
// ==========================================
// Get own assigned tasks (Blocked if mandatory password change is pending)
router.get('/my-tasks', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ENGINEER), auth_middleware_1.requirePasswordChanged, engineer_controller_1.EngineerController.getMyTasks);
// ==========================================
// Admin / Owner Endpoints
// ==========================================
// List all engineers with workload & status
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER), engineer_controller_1.EngineerController.getEngineers);
// Create new engineer account
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER), (0, validate_middleware_1.validateBody)(engineer_controller_1.CreateEngineerSchema), engineer_controller_1.EngineerController.createEngineer);
// Get engineer details (PARAMETERIZED PATH AFTER SPECIFIC PATHS)
router.get('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER), engineer_controller_1.EngineerController.getEngineerDetails);
// Activate / Deactivate engineer
router.patch('/:id/status', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER), (0, validate_middleware_1.validateBody)(engineer_controller_1.UpdateEngineerStatusSchema), engineer_controller_1.EngineerController.updateStatus);
// Admin reset engineer password
router.post('/:id/reset-password', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER), engineer_controller_1.EngineerController.resetEngineerPassword);
exports.default = router;
