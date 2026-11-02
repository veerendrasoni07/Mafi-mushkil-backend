import { Request, Response, NextFunction } from 'express';
import { UserRole, isAdminRole } from '../shared/constants/roles';
import { sendError } from '../shared/utils/response';

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    const userRole = req.user.role;

    // Check if role is directly in allowed list
    let isAllowed = allowedRoles.includes(userRole);

    // If allowedRoles includes ADMIN or OWNER, treat both as authorized administrators
    if (!isAllowed) {
      const allowsAdmin = allowedRoles.some((r) => r === UserRole.ADMIN || r === UserRole.OWNER);
      if (allowsAdmin && isAdminRole(userRole)) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      sendError(
        res,
        'FORBIDDEN',
        `Role '${userRole}' is not authorized to access this resource`,
        403
      );
      return;
    }

    next();
  };
}
