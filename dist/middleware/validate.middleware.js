"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
const zod_1 = require("zod");
const response_1 = require("../shared/utils/response");
function validateBody(schema) {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const details = err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                (0, response_1.sendError)(res, 'VALIDATION_ERROR', 'Validation failed for request body', 422, details);
                return;
            }
            (0, response_1.sendError)(res, 'BAD_REQUEST', 'Invalid request body format', 400);
        }
    };
}
function validateQuery(schema) {
    return async (req, res, next) => {
        try {
            req.query = await schema.parseAsync(req.query);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const details = err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                (0, response_1.sendError)(res, 'VALIDATION_ERROR', 'Validation failed for query parameters', 422, details);
                return;
            }
            (0, response_1.sendError)(res, 'BAD_REQUEST', 'Invalid query parameters format', 400);
        }
    };
}
