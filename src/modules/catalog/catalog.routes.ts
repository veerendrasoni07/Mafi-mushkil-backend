import { Router } from 'express';
import { CatalogController } from './catalog.controller';

const router = Router();

router.get('/services', CatalogController.getServices);
router.get('/services/:serviceId/categories', CatalogController.getCategoriesByService);
router.get('/categories/:categoryId/products', CatalogController.getProductsByCategory);
router.get('/search', CatalogController.search);

export default router;
