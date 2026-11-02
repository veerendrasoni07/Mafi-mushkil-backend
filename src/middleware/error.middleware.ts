import { Request, Response, NextFunction } from 'express';
import { sendError } from '../shared/utils/response';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Unhandled Error]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal error occurred';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  sendError(res, code, message, statusCode);
}
