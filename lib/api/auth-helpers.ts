import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getSession as getServerSession, hasOrganizationAccess as checkOrgAccess } from '@/lib/auth/auth-utils';
import { UnauthorizedError, ForbiddenError } from './error-handler';
import type { Session } from '@/lib/auth';

/**
 * Get session or throw UnauthorizedError
 * Use this in API routes wrapped with withErrorHandler
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw UnauthorizedError();
  }

  return session as Session;
}

/**
 * Get session from server components or throw UnauthorizedError
 */
export async function requireServerAuth(): Promise<Session> {
  const session = await getServerSession();

  if (!session?.user) {
    throw UnauthorizedError();
  }

  return session;
}

/**
 * Verify organization access or throw ForbiddenError
 * @param userId - User ID to check
 * @param organizationId - Organization ID to verify access to
 */
export async function requireOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<void> {
  const hasAccess = await checkOrgAccess(userId, organizationId);

  if (!hasAccess) {
    throw ForbiddenError('You do not have access to this organization');
  }
}

/**
 * Verify user is organization owner or throw ForbiddenError
 * @param userId - User ID to check
 * @param ownerId - Owner ID from organization
 */
export function requireOwnership(userId: string, ownerId: string): void {
  if (userId !== ownerId) {
    throw ForbiddenError('Only the organization owner can perform this action');
  }
}

/**
 * Verify user is either creator or admin
 * @param session - User session
 * @param creatorId - Creator ID from resource
 * @param ownerId - Organization owner ID
 */
export function requireCreatorOrAdmin(
  session: Session,
  creatorId: string,
  ownerId: string
): void {
  const isCreator = session.user.id === creatorId;
  const isAdmin = session.user.id === ownerId;

  if (!isCreator && !isAdmin) {
    throw ForbiddenError('You do not have permission to access this resource');
  }
}

/**
 * Verify user role matches expected role(s)
 */
export function requireRole(
  session: Session,
  allowedRoles: string[]
): void {
  const userRole = session.user.role as string | undefined;
  if (!userRole) {
    throw ForbiddenError('User role is required');
  }
  if (!allowedRoles.includes(userRole)) {
    throw ForbiddenError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`);
  }
}
