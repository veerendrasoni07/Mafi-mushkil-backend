import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../shared/constants/roles';
import { sendError } from '../shared/utils/response';

export interface JwtPayload {
  id: string;
  phone: string;
  role: UserRole;
  name: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'Authentication token missing or invalid', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'TOKEN_EXPIRED', 'Authentication token has expired', 401);
      return;
    }
    sendError(res, 'UNAUTHORIZED', 'Invalid authentication token', 401);
  }
}
