"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const support_controller_1 = require("./support.controller");
const router = (0, express_1.Router)();
router.get('/info', support_controller_1.SupportController.getSupportInfo);
router.get('/faqs', support_controller_1.SupportController.getFaqs);
exports.default = router;
