import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  };
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: any
): Response {
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(payload);
}
