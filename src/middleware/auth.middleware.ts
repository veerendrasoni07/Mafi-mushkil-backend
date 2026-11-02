import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../shared/constants/roles';
import { sendError } from '../shared/utils/response';
import { UserModel } from '../modules/users/user.model';

export interface JwtPayload {
  id: string;
  phone?: string;
  email?: string;
  role: UserRole;
  name: string;
  mustChangePassword?: boolean;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'Authentication token missing or invalid', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Check account status in database to enforce immediate deactivation
    const dbUser = await UserModel.findById(decoded.id).select('isActive mustChangePassword role name email phone');
    if (!dbUser) {
      sendError(res, 'USER_NOT_FOUND', 'User account does not exist or has been removed', 401);
      return;
    }

    if (!dbUser.isActive) {
      sendError(
        res,
        'ACCOUNT_DEACTIVATED',
        'Your account has been deactivated. Please contact an administrator.',
        403
      );
      return;
    }

    // Attach verified user info
    req.user = {
      id: dbUser._id.toString(),
      phone: dbUser.phone || decoded.phone,
      email: dbUser.email || decoded.email,
      role: dbUser.role,
      name: dbUser.name,
      mustChangePassword: dbUser.mustChangePassword,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'TOKEN_EXPIRED', 'Authentication token has expired', 401);
      return;
    }
    sendError(res, 'UNAUTHORIZED', 'Invalid authentication token', 401);
  }
}

/**
 * Middleware that blocks engineers who have not completed their mandatory first-login password change.
 */
export function requirePasswordChanged(req: Request, res: Response, next: NextFunction): void {
  if (req.user && req.user.role === UserRole.ENGINEER && req.user.mustChangePassword) {
    sendError(
      res,
      'PASSWORD_CHANGE_REQUIRED',
      'You must change your temporary password before accessing engineer tasks and resources.',
      403
    );
    return;
  }
  next();
}
