/**
 * Central type definitions for user roles
 * This ensures we don't repeat role types throughout the codebase
 */

export const USER_ROLES = {
  OWNER: "OWNER",
  CLIENT: "CLIENT",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Type guard to check if a string is a valid UserRole
export function isValidUserRole(role: string): role is UserRole {
  return role === USER_ROLES.OWNER || role === USER_ROLES.CLIENT;
}

// Helper to get all role values as an array
export const USER_ROLE_VALUES = Object.values(USER_ROLES);
