import { UserRole } from '../constants/roles';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone: string;
        role: UserRole;
        name: string;
      };
    }
  }
}

export {};
