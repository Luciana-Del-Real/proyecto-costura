import { Role } from './enums';

/**
 * Authenticated principal attached to the request by the JWT strategy.
 * Only `id` and `role` are needed for authorization decisions.
 */
export type Principal = {
  id: string;
  role: Role;
};

/**
 * Owner-or-admin rule shared by every resource-boundary service.
 * Returns true when the principal owns the resource or is an ADMIN.
 * Enforced centrally in the service boundary so every read/write path
 * receives the same IDOR rule and returns 403 before data mutation.
 */
export function isOwnerOrAdmin(
  principal: Principal,
  resourceOwnerId: string,
): boolean {
  return principal.id === resourceOwnerId || principal.role === Role.ADMIN;
}