import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { ServiceModel, CategoryModel, ProductModel, ComplaintTypeModel } from './catalog.models';
import { sendSuccess, sendError } from '../../shared/utils/response';

// Admin validation schemas
export const CreateServiceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').trim(),
  slug: z.string().optional(),
  iconKey: z.string().optional(),
  sortOrder: z.number().optional(),
});

export const UpdateServiceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').trim().optional(),
  iconKey: z.string().optional(),
  sortOrder: z.number().optional(),
});

export const UpdateStatusSchema = z.object({
  isActive: z.boolean(),
});

export const CreateCategorySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').trim(),
  slug: z.string().optional(),
  iconKey: z.string().optional(),
  sortOrder: z.number().optional(),
});

export const UpdateCategorySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').trim().optional(),
  iconKey: z.string().optional(),
  sortOrder: z.number().optional(),
});

export const CreateComplaintTypeSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').trim(),
  slug: z.string().optional(),
  sortOrder: z.number().optional(),
});

export const UpdateComplaintTypeSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').trim().optional(),
  sortOrder: z.number().optional(),
});

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export class CatalogController {
  // ---------------------------------------------------------
  // Public Customer Catalog Endpoints
  // ---------------------------------------------------------
  static async getServices(_req: Request, res: Response): Promise<void> {
    try {
      const [services, complaintTypes] = await Promise.all([
        ServiceModel.find({ isActive: true }).sort({ sortOrder: 1, title: 1 }).lean(),
        ComplaintTypeModel.find({ isActive: true }).sort({ sortOrder: 1, title: 1 }).lean(),
      ]);

      const typesByService = new Map<string, any[]>();
      for (const ct of complaintTypes) {
        const sKey = ct.serviceId.toString();
        if (!typesByService.has(sKey)) {
          typesByService.set(sKey, []);
        }
        typesByService.get(sKey)!.push({
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

      sendSuccess(res, formatted);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async getCategoriesByService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const categories = await CategoryModel.find({ serviceId, isActive: true })
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

      sendSuccess(res, formatted);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async getComplaintTypesByService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const complaintTypes = await ComplaintTypeModel.find({ serviceId, isActive: true })
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

      sendSuccess(res, formatted);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async getProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const products = await ProductModel.find({ categoryId, isActive: true })
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

      sendSuccess(res, formatted);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async search(req: Request, res: Response): Promise<void> {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      if (!q) {
        sendSuccess(res, { services: [], categories: [], products: [] });
        return;
      }

      const regex = new RegExp(q, 'i');

      const [services, categories, products] = await Promise.all([
        ServiceModel.find({ title: regex, isActive: true }).limit(5).lean(),
        CategoryModel.find({ title: regex, isActive: true }).limit(5).lean(),
        ProductModel.find({ title: regex, isActive: true }).limit(10).lean(),
      ]);

      sendSuccess(res, {
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
    } catch (err: any) {
      sendError(res, 'SEARCH_FAILED', err.message, 500);
    }
  }

  // ---------------------------------------------------------
  // Admin Service Management Endpoints
  // ---------------------------------------------------------
  static async adminGetServices(_req: Request, res: Response): Promise<void> {
    try {
      const services = await ServiceModel.find().sort({ sortOrder: 1, title: 1 }).lean();

      const [categories, complaintTypes] = await Promise.all([
        CategoryModel.find().lean(),
        ComplaintTypeModel.find().lean(),
      ]);

      const catCounts = new Map<string, number>();
      for (const c of categories) {
        const sKey = c.serviceId.toString();
        catCounts.set(sKey, (catCounts.get(sKey) || 0) + 1);
      }

      const compCounts = new Map<string, number>();
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

      sendSuccess(res, formatted);
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async adminCreateService(req: Request, res: Response): Promise<void> {
    try {
      const { title, slug, iconKey, sortOrder } = req.body;
      const finalSlug = slug ? generateSlug(slug) : generateSlug(title);

      const existing = await ServiceModel.findOne({
        $or: [{ slug: finalSlug }, { title: new RegExp(`^${title.trim()}$`, 'i') }],
      });
      if (existing) {
        sendError(res, 'DUPLICATE_SERVICE', 'A service with this title or slug already exists', 409);
        return;
      }

      const newService = await ServiceModel.create({
        title: title.trim(),
        slug: finalSlug,
        iconKey: iconKey || 'build',
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
        isActive: true,
      });

      sendSuccess(res, newService, 'Service category created successfully', 201);
    } catch (err: any) {
      sendError(res, 'CREATE_SERVICE_FAILED', err.message, 500);
    }
  }

  static async adminUpdateService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, iconKey, sortOrder } = req.body;

      const service = await ServiceModel.findById(id);
      if (!service) {
        sendError(res, 'SERVICE_NOT_FOUND', 'Service not found', 404);
        return;
      }

      if (title && title.trim() !== service.title) {
        const duplicate = await ServiceModel.findOne({
          _id: { $ne: service._id },
          title: new RegExp(`^${title.trim()}$`, 'i'),
        });
        if (duplicate) {
          sendError(res, 'DUPLICATE_TITLE', 'Another service with this title already exists', 409);
          return;
        }
        service.title = title.trim();
        service.slug = generateSlug(title);
      }

      if (iconKey !== undefined) service.iconKey = iconKey;
      if (sortOrder !== undefined) service.sortOrder = sortOrder;

      await service.save();
      sendSuccess(res, service, 'Service updated successfully');
    } catch (err: any) {
      sendError(res, 'UPDATE_FAILED', err.message, 500);
    }
  }

  static async adminUpdateServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const service = await ServiceModel.findById(id);
      if (!service) {
        sendError(res, 'SERVICE_NOT_FOUND', 'Service not found', 404);
        return;
      }

      service.isActive = isActive;
      await service.save();

      sendSuccess(res, service, `Service ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      sendError(res, 'UPDATE_FAILED', err.message, 500);
    }
  }

  // ---------------------------------------------------------
  // Admin Sub-services (Categories) Management
  // ---------------------------------------------------------
  static async adminGetCategories(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const categories = await CategoryModel.find({ serviceId }).sort({ sortOrder: 1, title: 1 }).lean();

      sendSuccess(
        res,
        categories.map((c) => ({
          id: c._id,
          serviceId: c.serviceId,
          title: c.title,
          slug: c.slug,
          iconKey: c.iconKey,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
        }))
      );
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async adminCreateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const { title, slug, iconKey, sortOrder } = req.body;

      const service = await ServiceModel.findById(serviceId);
      if (!service) {
        sendError(res, 'SERVICE_NOT_FOUND', 'Parent service not found', 404);
        return;
      }

      const finalSlug = slug ? generateSlug(slug) : generateSlug(title);
      const existing = await CategoryModel.findOne({
        serviceId: service._id,
        $or: [{ slug: finalSlug }, { title: new RegExp(`^${title.trim()}$`, 'i') }],
      });
      if (existing) {
        sendError(res, 'DUPLICATE_SUB_SERVICE', 'A sub-service with this title or slug already exists under this service', 409);
        return;
      }

      const newCategory = await CategoryModel.create({
        serviceId: service._id,
        title: title.trim(),
        slug: finalSlug,
        iconKey: iconKey || 'build',
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
        isActive: true,
      });

      sendSuccess(res, newCategory, 'Sub-service created successfully', 201);
    } catch (err: any) {
      sendError(res, 'CREATE_SUB_SERVICE_FAILED', err.message, 500);
    }
  }

  static async adminUpdateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, iconKey, sortOrder } = req.body;

      const category = await CategoryModel.findById(id);
      if (!category) {
        sendError(res, 'CATEGORY_NOT_FOUND', 'Sub-service not found', 404);
        return;
      }

      if (title && title.trim() !== category.title) {
        const duplicate = await CategoryModel.findOne({
          serviceId: category.serviceId,
          _id: { $ne: category._id },
          title: new RegExp(`^${title.trim()}$`, 'i'),
        });
        if (duplicate) {
          sendError(res, 'DUPLICATE_TITLE', 'Another sub-service with this title exists under this service', 409);
          return;
        }
        category.title = title.trim();
        category.slug = generateSlug(title);
      }

      if (iconKey !== undefined) category.iconKey = iconKey;
      if (sortOrder !== undefined) category.sortOrder = sortOrder;

      await category.save();
      sendSuccess(res, category, 'Sub-service updated successfully');
    } catch (err: any) {
      sendError(res, 'UPDATE_FAILED', err.message, 500);
    }
  }

  static async adminUpdateCategoryStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const category = await CategoryModel.findById(id);
      if (!category) {
        sendError(res, 'CATEGORY_NOT_FOUND', 'Sub-service not found', 404);
        return;
      }

      category.isActive = isActive;
      await category.save();

      sendSuccess(res, category, `Sub-service ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      sendError(res, 'UPDATE_FAILED', err.message, 500);
    }
  }

  // ---------------------------------------------------------
  // Admin Complaint Types Management
  // ---------------------------------------------------------
  static async adminGetComplaintTypes(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const types = await ComplaintTypeModel.find({ serviceId }).sort({ sortOrder: 1, title: 1 }).lean();

      sendSuccess(
        res,
        types.map((t) => ({
          id: t._id,
          serviceId: t.serviceId,
          title: t.title,
          slug: t.slug,
          sortOrder: t.sortOrder,
          isActive: t.isActive,
        }))
      );
    } catch (err: any) {
      sendError(res, 'FETCH_FAILED', err.message, 500);
    }
  }

  static async adminCreateComplaintType(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const { title, slug, sortOrder } = req.body;

      const service = await ServiceModel.findById(serviceId);
      if (!service) {
        sendError(res, 'SERVICE_NOT_FOUND', 'Parent service not found', 404);
        return;
      }

      const existing = await ComplaintTypeModel.findOne({
        serviceId: service._id,
        title: new RegExp(`^${title.trim()}$`, 'i'),
      });
      if (existing) {
        sendError(res, 'DUPLICATE_COMPLAINT_TYPE', 'A complaint type with this title already exists under this service', 409);
        return;
      }

      const finalSlug = slug ? generateSlug(slug) : generateSlug(title);
      const newComplaintType = await ComplaintTypeModel.create({
        serviceId: service._id,
        title: title.trim(),
        slug: finalSlug,
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
        isActive: true,
      });

      // Keep service.complaintIssues updated
      await ServiceModel.updateOne(
        { _id: service._id },
        { $addToSet: { complaintIssues: title.trim() } }
      );

      sendSuccess(res, newComplaintType, 'Complaint type created successfully', 201);
    } catch (err: any) {
      sendError(res, 'CREATE_COMPLAINT_TYPE_FAILED', err.message, 500);
    }
  }

  static async adminUpdateComplaintType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, sortOrder } = req.body;

      const complaintType = await ComplaintTypeModel.findById(id);
      if (!complaintType) {
        sendError(res, 'COMPLAINT_TYPE_NOT_FOUND', 'Complaint type not found', 404);
        return;
      }

      const oldTitle = complaintType.title;

      if (title && title.trim() !== complaintType.title) {
        const duplicate = await ComplaintTypeModel.findOne({
          serviceId: complaintType.serviceId,
          _id: { $ne: complaintType._id },
          title: new RegExp(`^${title.trim()}$`, 'i'),
        });
        if (duplicate) {
          sendError(res, 'DUPLICATE_TITLE', 'Another complaint type with this title exists under this service', 409);
          return;
        }
        complaintType.title = title.trim();
        complaintType.slug = generateSlug(title);

        // Update in parent service complaintIssues
        const service = await ServiceModel.findById(complaintType.serviceId);
        if (service) {
          service.complaintIssues = service.complaintIssues.map((t) => (t === oldTitle ? title.trim() : t));
          await service.save();
        }
      }

      if (sortOrder !== undefined) complaintType.sortOrder = sortOrder;

      await complaintType.save();
      sendSuccess(res, complaintType, 'Complaint type updated successfully');
    } catch (err: any) {
      sendError(res, 'UPDATE_FAILED', err.message, 500);
    }
  }

  static async adminUpdateComplaintTypeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const complaintType = await ComplaintTypeModel.findById(id);
      if (!complaintType) {
        sendError(res, 'COMPLAINT_TYPE_NOT_FOUND', 'Complaint type not found', 404);
        return;
      }

      complaintType.isActive = isActive;
      await complaintType.save();

      sendSuccess(res, complaintType, `Complaint type ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      sendError(res, 'UPDATE_FAILED', err.message, 500);
    }
  }
}
