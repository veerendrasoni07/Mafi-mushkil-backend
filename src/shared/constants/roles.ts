export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ENGINEER = 'ENGINEER',
  ADMIN = 'ADMIN',
  // Backward-compatible alias for existing records and tokens
  OWNER = 'OWNER',
}

export const ALL_ROLES = [
  UserRole.CUSTOMER,
  UserRole.ENGINEER,
  UserRole.ADMIN,
  UserRole.OWNER,
] as const;

export function isAdminRole(role?: string | null): boolean {
  return role === UserRole.ADMIN || role === UserRole.OWNER;
}
