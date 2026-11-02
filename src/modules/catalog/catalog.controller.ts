import { Request, Response } from 'express';
import { ServiceModel, CategoryModel, ProductModel } from './catalog.models';
import { sendSuccess, sendError } from '../../shared/utils/response';

export class CatalogController {
  static async getServices(_req: Request, res: Response): Promise<void> {
    try {
      const services = await ServiceModel.find({ isActive: true })
        .sort({ sortOrder: 1, title: 1 })
        .lean();

      const formatted = services.map((s) => ({
        id: s._id,
        title: s.title,
        slug: s.slug,
        iconKey: s.iconKey,
        sortOrder: s.sortOrder,
      }));

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
}
