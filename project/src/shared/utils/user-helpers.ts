/**
 * User helper utilities for checking user types and roles
 */

export interface UserWithAccountType {
  accountType: 'admin' | 'user';
  role?: string;
}

/**
 * Check if a user is an admin account type
 * 
 * @param user - User object from JWT payload or CurrentUser decorator
 * @returns true if user is an admin account type, false otherwise
 */
export function isAdminAccount(user: UserWithAccountType | null | undefined): boolean {
  if (!user) {
    return false;
  }
  
  return user.accountType === 'admin';
}

/**
 * Check if a user is a super admin (admin account type with super_admin role)
 * 
 * @param user - User object from JWT payload or CurrentUser decorator
 * @returns true if user is a super admin, false otherwise
 */
export function isSuperAdmin(user: UserWithAccountType | null | undefined): boolean {
  if (!isAdminAccount(user)) {
    return false;
  }
  
  return user?.role === 'super_admin';
}

/**
 * Check if a user has admin or super_admin role (for admin account types)
 * This is useful for checking permissions where both admin and super_admin have access
 * 
 * @param user - User object from JWT payload or CurrentUser decorator
 * @param role - Optional role string to check (if user object is not available)
 * @returns true if user is an admin account type with admin or super_admin role
 * 
 * @example
 * // Using user object
 * if (isAdminOrSuperAdmin(user)) { ... }
 * 
 * // Using role string directly
 * if (isAdminOrSuperAdmin(null, user.role)) { ... }
 */
export function isAdminOrSuperAdmin(user: UserWithAccountType | null | undefined, role?: string): boolean {
  // Only use the user object to determine if the user is an admin account type if it is not null or undefined
  if (user !== null && user !== undefined && !isAdminAccount(user)) {
    return false;
  }
  
  const userRole = role || user?.role;
  return userRole === 'admin' || userRole === 'super_admin';
}

/**
 * Check if a user is a regular user account type
 * 
 * @param user - User object from JWT payload or CurrentUser decorator
 * @returns true if user is a regular user account type, false otherwise
 */
export function isRegularUser(user: UserWithAccountType | null | undefined): boolean {
  if (!user) {
    return false;
  }
  
  return user.accountType === 'user';
}

