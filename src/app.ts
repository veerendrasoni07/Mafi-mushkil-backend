import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import requestRoutes from './modules/requests/request.routes';
import engineerRoutes from './modules/engineers/engineer.routes';
import complaintRoutes from './modules/complaints/complaint.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import promotionRoutes from './modules/promotions/promotion.routes';
import supportRoutes from './modules/support/support.routes';

export function createApp(): Application {
  const app = express();

  // Security & Utility Middleware
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate Limiting for public endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } },
  });
  app.use('/api/', apiLimiter);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: new Date() });
  });

  // REST API v1
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/catalog', catalogRoutes);
  app.use('/api/v1/requests', requestRoutes);
  app.use('/api/v1/engineers', engineerRoutes);
  app.use('/api/v1/complaints', complaintRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/promotions', promotionRoutes);
  app.use('/api/v1/support', supportRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'The requested API route was not found.' },
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
