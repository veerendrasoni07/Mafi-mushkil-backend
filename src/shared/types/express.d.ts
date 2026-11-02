import { UserRole } from '../constants/roles';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone?: string;
        email?: string;
        role: UserRole;
        name: string;
        mustChangePassword?: boolean;
      };
    }
  }
}

export {};
