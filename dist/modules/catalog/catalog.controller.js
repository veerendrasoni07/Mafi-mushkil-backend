"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = exports.UpdateComplaintTypeSchema = exports.CreateComplaintTypeSchema = exports.UpdateCategorySchema = exports.CreateCategorySchema = exports.UpdateStatusSchema = exports.UpdateServiceSchema = exports.CreateServiceSchema = void 0;
const zod_1 = require("zod");
const catalog_models_1 = require("./catalog.models");
const response_1 = require("../../shared/utils/response");
// Admin validation schemas
exports.CreateServiceSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Title must be at least 2 characters').trim(),
    slug: zod_1.z.string().optional(),
    iconKey: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().optional(),
});
exports.UpdateServiceSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Title must be at least 2 characters').trim().optional(),
    iconKey: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().optional(),
});
exports.UpdateStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean(),
});
exports.CreateCategorySchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Title must be at least 2 characters').trim(),
    slug: zod_1.z.string().optional(),
    iconKey: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().optional(),
});
exports.UpdateCategorySchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Title must be at least 2 characters').trim().optional(),
    iconKey: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().optional(),
});
exports.CreateComplaintTypeSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Title must be at least 2 characters').trim(),
    slug: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().optional(),
});
exports.UpdateComplaintTypeSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Title must be at least 2 characters').trim().optional(),
    sortOrder: zod_1.z.number().optional(),
});
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
class CatalogController {
    // ---------------------------------------------------------
    // Public Customer Catalog Endpoints
    // ---------------------------------------------------------
    static async getServices(_req, res) {
        try {
            const [services, complaintTypes] = await Promise.all([
                catalog_models_1.ServiceModel.find({ isActive: true }).sort({ sortOrder: 1, title: 1 }).lean(),
                catalog_models_1.ComplaintTypeModel.find({ isActive: true }).sort({ sortOrder: 1, title: 1 }).lean(),
            ]);
            const typesByService = new Map();
            for (const ct of complaintTypes) {
                const sKey = ct.serviceId.toString();
                if (!typesByService.has(sKey)) {
                    typesByService.set(sKey, []);
                }
                typesByService.get(sKey).push({
                    id: ct._id,
                    serviceId: ct.serviceId,
                    title: ct.title,
                    slug: ct.slug,
                    sortOrder: ct.sortOrder,
                    isActive: ct.isActive,
                });
            }
            const formatted = services.map((s) => {
                const cts = typesByService.get(s._id.toString()) || [];
                return {
                    id: s._id,
                    title: s.title,
                    slug: s.slug,
                    iconKey: s.iconKey,
                    sortOrder: s.sortOrder,
                    complaintIssues: cts.length > 0 ? cts.map((c) => c.title) : s.complaintIssues || [],
                    complaintTypes: cts,
                };
            });
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
    static async getComplaintTypesByService(req, res) {
        try {
            const { serviceId } = req.params;
            const complaintTypes = await catalog_models_1.ComplaintTypeModel.find({ serviceId, isActive: true })
                .sort({ sortOrder: 1, title: 1 })
                .lean();
            const formatted = complaintTypes.map((ct) => ({
                id: ct._id,
                serviceId: ct.serviceId,
                title: ct.title,
                slug: ct.slug,
                sortOrder: ct.sortOrder,
                isActive: ct.isActive,
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
    // ---------------------------------------------------------
    // Admin Service Management Endpoints
    // ---------------------------------------------------------
    static async adminGetServices(_req, res) {
        try {
            const services = await catalog_models_1.ServiceModel.find().sort({ sortOrder: 1, title: 1 }).lean();
            const [categories, complaintTypes] = await Promise.all([
                catalog_models_1.CategoryModel.find().lean(),
                catalog_models_1.ComplaintTypeModel.find().lean(),
            ]);
            const catCounts = new Map();
            for (const c of categories) {
                const sKey = c.serviceId.toString();
                catCounts.set(sKey, (catCounts.get(sKey) || 0) + 1);
            }
            const compCounts = new Map();
            for (const ct of complaintTypes) {
                const sKey = ct.serviceId.toString();
                compCounts.set(sKey, (compCounts.get(sKey) || 0) + 1);
            }
            const formatted = services.map((s) => ({
                id: s._id,
                title: s.title,
                slug: s.slug,
                iconKey: s.iconKey,
                sortOrder: s.sortOrder,
                isActive: s.isActive,
                subServicesCount: catCounts.get(s._id.toString()) || 0,
                complaintTypesCount: compCounts.get(s._id.toString()) || (s.complaintIssues?.length || 0),
                complaintIssues: s.complaintIssues || [],
            }));
            (0, response_1.sendSuccess)(res, formatted);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async adminCreateService(req, res) {
        try {
            const { title, slug, iconKey, sortOrder } = req.body;
            const finalSlug = slug ? generateSlug(slug) : generateSlug(title);
            const existing = await catalog_models_1.ServiceModel.findOne({
                $or: [{ slug: finalSlug }, { title: new RegExp(`^${title.trim()}$`, 'i') }],
            });
            if (existing) {
                (0, response_1.sendError)(res, 'DUPLICATE_SERVICE', 'A service with this title or slug already exists', 409);
                return;
            }
            const newService = await catalog_models_1.ServiceModel.create({
                title: title.trim(),
                slug: finalSlug,
                iconKey: iconKey || 'build',
                sortOrder: sortOrder !== undefined ? sortOrder : 0,
                isActive: true,
            });
            (0, response_1.sendSuccess)(res, newService, 'Service category created successfully', 201);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'CREATE_SERVICE_FAILED', err.message, 500);
        }
    }
    static async adminUpdateService(req, res) {
        try {
            const { id } = req.params;
            const { title, iconKey, sortOrder } = req.body;
            const service = await catalog_models_1.ServiceModel.findById(id);
            if (!service) {
                (0, response_1.sendError)(res, 'SERVICE_NOT_FOUND', 'Service not found', 404);
                return;
            }
            if (title && title.trim() !== service.title) {
                const duplicate = await catalog_models_1.ServiceModel.findOne({
                    _id: { $ne: service._id },
                    title: new RegExp(`^${title.trim()}$`, 'i'),
                });
                if (duplicate) {
                    (0, response_1.sendError)(res, 'DUPLICATE_TITLE', 'Another service with this title already exists', 409);
                    return;
                }
                service.title = title.trim();
                service.slug = generateSlug(title);
            }
            if (iconKey !== undefined)
                service.iconKey = iconKey;
            if (sortOrder !== undefined)
                service.sortOrder = sortOrder;
            await service.save();
            (0, response_1.sendSuccess)(res, service, 'Service updated successfully');
        }
        catch (err) {
            (0, response_1.sendError)(res, 'UPDATE_FAILED', err.message, 500);
        }
    }
    static async adminUpdateServiceStatus(req, res) {
        try {
            const { id } = req.params;
            const { isActive } = req.body;
            const service = await catalog_models_1.ServiceModel.findById(id);
            if (!service) {
                (0, response_1.sendError)(res, 'SERVICE_NOT_FOUND', 'Service not found', 404);
                return;
            }
            service.isActive = isActive;
            await service.save();
            (0, response_1.sendSuccess)(res, service, `Service ${isActive ? 'activated' : 'deactivated'} successfully`);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'UPDATE_FAILED', err.message, 500);
        }
    }
    // ---------------------------------------------------------
    // Admin Sub-services (Categories) Management
    // ---------------------------------------------------------
    static async adminGetCategories(req, res) {
        try {
            const { serviceId } = req.params;
            const categories = await catalog_models_1.CategoryModel.find({ serviceId }).sort({ sortOrder: 1, title: 1 }).lean();
            (0, response_1.sendSuccess)(res, categories.map((c) => ({
                id: c._id,
                serviceId: c.serviceId,
                title: c.title,
                slug: c.slug,
                iconKey: c.iconKey,
                sortOrder: c.sortOrder,
                isActive: c.isActive,
            })));
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async adminCreateCategory(req, res) {
        try {
            const { serviceId } = req.params;
            const { title, slug, iconKey, sortOrder } = req.body;
            const service = await catalog_models_1.ServiceModel.findById(serviceId);
            if (!service) {
                (0, response_1.sendError)(res, 'SERVICE_NOT_FOUND', 'Parent service not found', 404);
                return;
            }
            const finalSlug = slug ? generateSlug(slug) : generateSlug(title);
            const existing = await catalog_models_1.CategoryModel.findOne({
                serviceId: service._id,
                $or: [{ slug: finalSlug }, { title: new RegExp(`^${title.trim()}$`, 'i') }],
            });
            if (existing) {
                (0, response_1.sendError)(res, 'DUPLICATE_SUB_SERVICE', 'A sub-service with this title or slug already exists under this service', 409);
                return;
            }
            const newCategory = await catalog_models_1.CategoryModel.create({
                serviceId: service._id,
                title: title.trim(),
                slug: finalSlug,
                iconKey: iconKey || 'build',
                sortOrder: sortOrder !== undefined ? sortOrder : 0,
                isActive: true,
            });
            (0, response_1.sendSuccess)(res, newCategory, 'Sub-service created successfully', 201);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'CREATE_SUB_SERVICE_FAILED', err.message, 500);
        }
    }
    static async adminUpdateCategory(req, res) {
        try {
            const { id } = req.params;
            const { title, iconKey, sortOrder } = req.body;
            const category = await catalog_models_1.CategoryModel.findById(id);
            if (!category) {
                (0, response_1.sendError)(res, 'CATEGORY_NOT_FOUND', 'Sub-service not found', 404);
                return;
            }
            if (title && title.trim() !== category.title) {
                const duplicate = await catalog_models_1.CategoryModel.findOne({
                    serviceId: category.serviceId,
                    _id: { $ne: category._id },
                    title: new RegExp(`^${title.trim()}$`, 'i'),
                });
                if (duplicate) {
                    (0, response_1.sendError)(res, 'DUPLICATE_TITLE', 'Another sub-service with this title exists under this service', 409);
                    return;
                }
                category.title = title.trim();
                category.slug = generateSlug(title);
            }
            if (iconKey !== undefined)
                category.iconKey = iconKey;
            if (sortOrder !== undefined)
                category.sortOrder = sortOrder;
            await category.save();
            (0, response_1.sendSuccess)(res, category, 'Sub-service updated successfully');
        }
        catch (err) {
            (0, response_1.sendError)(res, 'UPDATE_FAILED', err.message, 500);
        }
    }
    static async adminUpdateCategoryStatus(req, res) {
        try {
            const { id } = req.params;
            const { isActive } = req.body;
            const category = await catalog_models_1.CategoryModel.findById(id);
            if (!category) {
                (0, response_1.sendError)(res, 'CATEGORY_NOT_FOUND', 'Sub-service not found', 404);
                return;
            }
            category.isActive = isActive;
            await category.save();
            (0, response_1.sendSuccess)(res, category, `Sub-service ${isActive ? 'activated' : 'deactivated'} successfully`);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'UPDATE_FAILED', err.message, 500);
        }
    }
    // ---------------------------------------------------------
    // Admin Complaint Types Management
    // ---------------------------------------------------------
    static async adminGetComplaintTypes(req, res) {
        try {
            const { serviceId } = req.params;
            const types = await catalog_models_1.ComplaintTypeModel.find({ serviceId }).sort({ sortOrder: 1, title: 1 }).lean();
            (0, response_1.sendSuccess)(res, types.map((t) => ({
                id: t._id,
                serviceId: t.serviceId,
                title: t.title,
                slug: t.slug,
                sortOrder: t.sortOrder,
                isActive: t.isActive,
            })));
        }
        catch (err) {
            (0, response_1.sendError)(res, 'FETCH_FAILED', err.message, 500);
        }
    }
    static async adminCreateComplaintType(req, res) {
        try {
            const { serviceId } = req.params;
            const { title, slug, sortOrder } = req.body;
            const service = await catalog_models_1.ServiceModel.findById(serviceId);
            if (!service) {
                (0, response_1.sendError)(res, 'SERVICE_NOT_FOUND', 'Parent service not found', 404);
                return;
            }
            const existing = await catalog_models_1.ComplaintTypeModel.findOne({
                serviceId: service._id,
                title: new RegExp(`^${title.trim()}$`, 'i'),
            });
            if (existing) {
                (0, response_1.sendError)(res, 'DUPLICATE_COMPLAINT_TYPE', 'A complaint type with this title already exists under this service', 409);
                return;
            }
            const finalSlug = slug ? generateSlug(slug) : generateSlug(title);
            const newComplaintType = await catalog_models_1.ComplaintTypeModel.create({
                serviceId: service._id,
                title: title.trim(),
                slug: finalSlug,
                sortOrder: sortOrder !== undefined ? sortOrder : 0,
                isActive: true,
            });
            // Keep service.complaintIssues updated
            await catalog_models_1.ServiceModel.updateOne({ _id: service._id }, { $addToSet: { complaintIssues: title.trim() } });
            (0, response_1.sendSuccess)(res, newComplaintType, 'Complaint type created successfully', 201);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'CREATE_COMPLAINT_TYPE_FAILED', err.message, 500);
        }
    }
    static async adminUpdateComplaintType(req, res) {
        try {
            const { id } = req.params;
            const { title, sortOrder } = req.body;
            const complaintType = await catalog_models_1.ComplaintTypeModel.findById(id);
            if (!complaintType) {
                (0, response_1.sendError)(res, 'COMPLAINT_TYPE_NOT_FOUND', 'Complaint type not found', 404);
                return;
            }
            const oldTitle = complaintType.title;
            if (title && title.trim() !== complaintType.title) {
                const duplicate = await catalog_models_1.ComplaintTypeModel.findOne({
                    serviceId: complaintType.serviceId,
                    _id: { $ne: complaintType._id },
                    title: new RegExp(`^${title.trim()}$`, 'i'),
                });
                if (duplicate) {
                    (0, response_1.sendError)(res, 'DUPLICATE_TITLE', 'Another complaint type with this title exists under this service', 409);
                    return;
                }
                complaintType.title = title.trim();
                complaintType.slug = generateSlug(title);
                // Update in parent service complaintIssues
                const service = await catalog_models_1.ServiceModel.findById(complaintType.serviceId);
                if (service) {
                    service.complaintIssues = service.complaintIssues.map((t) => (t === oldTitle ? title.trim() : t));
                    await service.save();
                }
            }
            if (sortOrder !== undefined)
                complaintType.sortOrder = sortOrder;
            await complaintType.save();
            (0, response_1.sendSuccess)(res, complaintType, 'Complaint type updated successfully');
        }
        catch (err) {
            (0, response_1.sendError)(res, 'UPDATE_FAILED', err.message, 500);
        }
    }
    static async adminUpdateComplaintTypeStatus(req, res) {
        try {
            const { id } = req.params;
            const { isActive } = req.body;
            const complaintType = await catalog_models_1.ComplaintTypeModel.findById(id);
            if (!complaintType) {
                (0, response_1.sendError)(res, 'COMPLAINT_TYPE_NOT_FOUND', 'Complaint type not found', 404);
                return;
            }
            complaintType.isActive = isActive;
            await complaintType.save();
            (0, response_1.sendSuccess)(res, complaintType, `Complaint type ${isActive ? 'activated' : 'deactivated'} successfully`);
        }
        catch (err) {
            (0, response_1.sendError)(res, 'UPDATE_FAILED', err.message, 500);
        }
    }
}
exports.CatalogController = CatalogController;
