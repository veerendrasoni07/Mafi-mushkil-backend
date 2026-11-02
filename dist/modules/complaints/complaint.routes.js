"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const complaint_controller_1 = require("./complaint.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const roles_1 = require("../../shared/constants/roles");
const router = (0, express_1.Router)();
// Customer creates complaint
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.CUSTOMER), (0, validate_middleware_1.validateBody)(complaint_controller_1.CreateComplaintSchema), complaint_controller_1.ComplaintController.create);
// Customer lists own complaints
router.get('/my', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.CUSTOMER), complaint_controller_1.ComplaintController.getMyComplaints);
// Admin / Owner lists all complaints
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorizeRoles)(roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER), complaint_controller_1.ComplaintController.getAllComplaints);
exports.default = router;
