export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  OWNER = 'OWNER',
  ENGINEER = 'ENGINEER',
}

export const ALL_ROLES = [UserRole.CUSTOMER, UserRole.OWNER, UserRole.ENGINEER] as const;
