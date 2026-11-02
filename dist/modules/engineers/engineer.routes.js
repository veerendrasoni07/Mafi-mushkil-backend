"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const engineer_controller_1 = require("./engineer.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const roles_1 = require("../../shared/constants/roles");
const router = (0, express_1.Router)();
// Owner endpoint: list team with availability
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.OWNER), engineer_controller_1.EngineerController.getEngineers);
// Engineer endpoint: get assigned tasks
router.get('/my-tasks', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ENGINEER), engineer_controller_1.EngineerController.getMyTasks);
exports.default = router;
