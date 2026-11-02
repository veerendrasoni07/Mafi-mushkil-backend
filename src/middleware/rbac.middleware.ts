import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../shared/constants/roles';
import { sendError } from '../shared/utils/response';

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        'FORBIDDEN',
        `Role '${req.user.role}' is not authorized to access this resource`,
        403
      );
      return;
    }

    next();
  };
}
