import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { UnauthorizedError, ForbiddenError } from './error-handler';

/**
 * Authentication context passed to route handlers
 */
export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'saas-admin' | 'admin' | 'creator';
    organizationId?: string;
  };
  session: {
    user: {
      id: string;
      email: string;
      name?: string;
      role?: string;
      organizationId?: string;
    };
  };
}

/**
 * Requires authentication - throws UnauthorizedError if not authenticated
 * This is the primary authentication function to use in API routes
 *
 * @param request - Optional NextRequest object
 * @returns AuthContext with user and session information
 * @throws UnauthorizedError if not authenticated
 */
export async function requireAuth(request?: NextRequest): Promise<AuthContext> {
  const session = await auth.api.getSession({
    headers: request ? request.headers : await headers(),
  });

  if (!session?.user) {
    throw UnauthorizedError();
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || '',
      role: (session.user.role as 'saas-admin' | 'admin' | 'creator') || 'admin',
      organizationId: session.user.organizationId ?? undefined,
    },
    session: session as AuthContext['session'],
  };
}

/**
 * Requires admin role (either 'admin' or 'saas-admin')
 *
 * @param request - Optional NextRequest object
 * @returns AuthContext with admin user information
 * @throws UnauthorizedError if not authenticated
 * @throws ForbiddenError if user is not an admin
 */
export async function requireAdmin(request?: NextRequest): Promise<AuthContext> {
  const context = await requireAuth(request);

  if (context.user.role !== 'admin' && context.user.role !== 'saas-admin') {
    throw ForbiddenError('Admin access required');
  }

  return context;
}

/**
 * Requires organization access - verifies user belongs to the specified organization
 * SaaS admins have access to all organizations
 *
 * @param organizationId - Organization ID to verify access to
 * @param request - Optional NextRequest object
 * @returns AuthContext with user information
 * @throws UnauthorizedError if not authenticated
 * @throws ForbiddenError if user doesn't have access to the organization
 */
export async function requireOrgAccess(
  organizationId: string,
  request?: NextRequest
): Promise<AuthContext> {
  const context = await requireAuth(request);

  // SaaS admin has access to all organizations
  if (context.user.role === 'saas-admin') {
    return context;
  }

  // Check if user belongs to the organization
  const hasAccess = context.user.organizationId === organizationId;

  if (!hasAccess) {
    // Additional check using the database
    const { hasOrganizationAccess } = await import('@/lib/auth');
    const dbAccess = await hasOrganizationAccess(context.user.id, organizationId);

    if (!dbAccess) {
      throw ForbiddenError('You do not have access to this organization');
    }
  }

  return context;
}

/**
 * Optional authentication - returns null if not authenticated
 * Use this for routes that can work with or without authentication
 *
 * @param request - Optional NextRequest object
 * @returns AuthContext if authenticated, null otherwise
 */
export async function optionalAuth(request?: NextRequest): Promise<AuthContext | null> {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}

/**
 * Higher-Order Function for routes requiring authentication
 * Automatically handles authentication and passes user context to handler
 *
 * @param handler - Route handler function that receives request, auth context, and optional params
 * @returns Wrapped route handler
 *
 * @example
 * ```typescript
 * export const GET = withErrorHandler(
 *   withAuth(async (request, { user }) => {
 *     // user is automatically authenticated
 *     const data = await fetchUserData(user.id);
 *     return NextResponse.json({ success: true, data });
 *   })
 * );
 * ```
 */
export function withAuth<T = unknown>(
  handler: (
    request: NextRequest,
    context: AuthContext,
    params?: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, params?: T): Promise<NextResponse> => {
    const authContext = await requireAuth(request);
    return handler(request, authContext, params);
  };
}

/**
 * Higher-Order Function for routes requiring admin access
 * Automatically handles authentication and admin role verification
 *
 * @param handler - Route handler function that receives request, auth context, and optional params
 * @returns Wrapped route handler
 *
 * @example
 * ```typescript
 * export const DELETE = withErrorHandler(
 *   withAdminAuth(async (request, { user }) => {
 *     // user is automatically authenticated and verified as admin
 *     await deleteResource();
 *     return NextResponse.json({ success: true });
 *   })
 * );
 * ```
 */
export function withAdminAuth<T = unknown>(
  handler: (
    request: NextRequest,
    context: AuthContext,
    params?: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, params?: T): Promise<NextResponse> => {
    const authContext = await requireAdmin(request);
    return handler(request, authContext, params);
  };
}

/**
 * Higher-Order Function for routes requiring organization access
 * Automatically handles authentication and organization access verification
 *
 * @param getOrgId - Function to extract organization ID from request or params
 * @param handler - Route handler function that receives request, auth context, and optional params
 * @returns Wrapped route handler
 *
 * @example
 * ```typescript
 * export const GET = withErrorHandler(
 *   withOrgAccess(
 *     (req) => new URL(req.url).searchParams.get('organizationId')!,
 *     async (request, { user }) => {
 *       // user is automatically authenticated and verified for org access
 *       const data = await fetchOrgData();
 *       return NextResponse.json({ success: true, data });
 *     }
 *   )
 * );
 * ```
 */
export function withOrgAccess<T = unknown>(
  getOrgId: (request: NextRequest, params?: T) => string,
  handler: (
    request: NextRequest,
    context: AuthContext,
    params?: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, params?: T): Promise<NextResponse> => {
    const organizationId = getOrgId(request, params);
    const authContext = await requireOrgAccess(organizationId, request);
    return handler(request, authContext, params);
  };
}
