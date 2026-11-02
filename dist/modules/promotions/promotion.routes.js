"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promotion_controller_1 = require("./promotion.controller");
const router = (0, express_1.Router)();
router.get('/', promotion_controller_1.PromotionController.getPromotions);
exports.default = router;
