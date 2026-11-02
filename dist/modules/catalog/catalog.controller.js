"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = void 0;
const catalog_models_1 = require("./catalog.models");
const response_1 = require("../../shared/utils/response");
class CatalogController {
    static async getServices(_req, res) {
        try {
            const services = await catalog_models_1.ServiceModel.find({ isActive: true })
                .sort({ sortOrder: 1, title: 1 })
                .lean();
            const formatted = services.map((s) => ({
                id: s._id,
                title: s.title,
                slug: s.slug,
                iconKey: s.iconKey,
                sortOrder: s.sortOrder,
            }));
            (0, response_1.sendSuccess)(res, formatted);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async getCategoriesByService(req, res) {
        try {
            const { serviceId } = req.params;
            const categories = await catalog_models_1.CategoryModel.find({ serviceId, isActive: true })
                .sort({ sortOrder: 1, title: 1 })
                .lean();
            const formatted = categories.map((c) => ({
                id: c._id,
                serviceId: c.serviceId,
                title: c.title,
                slug: c.slug,
                iconKey: c.iconKey,
                sortOrder: c.sortOrder,
            }));
            (0, response_1.sendSuccess)(res, formatted);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async getProductsByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const products = await catalog_models_1.ProductModel.find({ categoryId, isActive: true })
                .sort({ sortOrder: 1, priceMinorUnits: 1 })
                .lean();
            const formatted = products.map((p) => ({
                id: p._id,
                serviceId: p.serviceId,
                categoryId: p.categoryId,
                title: p.title,
                description: p.description,
                priceMinorUnits: p.priceMinorUnits,
                formattedPrice: `Rs. ${(p.priceMinorUnits / 100).toLocaleString('en-IN')}`,
                currency: p.currency,
                imageKey: p.imageKey,
            }));
            (0, response_1.sendSuccess)(res, formatted);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async search(req, res) {
        try {
            const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
            if (!q) {
                (0, response_1.sendSuccess)(res, { services: [], categories: [], products: [] });
                return;
            }
            const regex = new RegExp(q, 'i');
            const [services, categories, products] = await Promise.all([
                catalog_models_1.ServiceModel.find({ title: regex, isActive: true }).limit(5).lean(),
                catalog_models_1.CategoryModel.find({ title: regex, isActive: true }).limit(5).lean(),
                catalog_models_1.ProductModel.find({ title: regex, isActive: true }).limit(10).lean(),
            ]);
            (0, response_1.sendSuccess)(res, {
                services: services.map((s) => ({ id: s._id, title: s.title, iconKey: s.iconKey })),
                categories: categories.map((c) => ({ id: c._id, title: c.title, serviceId: c.serviceId })),
                products: products.map((p) => ({
                    id: p._id,
                    title: p.title,
                    serviceId: p.serviceId,
                    categoryId: p.categoryId,
                    priceMinorUnits: p.priceMinorUnits,
                    formattedPrice: `Rs. ${(p.priceMinorUnits / 100).toLocaleString('en-IN')}`,
                })),
            });
        }
        catch (err) {
            (0, response_1.sendError)(res, 'SEARCH_FAILED', err.message, 500);
        }
    }
}
exports.CatalogController = CatalogController;
