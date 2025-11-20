// lib/auth/auth-utils.ts
import { auth } from "./betterauth";
import { headers } from "next/headers";
import { cache } from "react";
import { createLogger } from "@/lib/utils/logger";
import User from "@/lib/db/models/User";
import type { IUser } from "@/lib/db/models/User";
import { ensureDbConnection } from "@/lib/db/mongodb";
import bcrypt from "bcryptjs";

const logger = createLogger('auth-utils');

/**
 * Session interface matching Better Auth session structure
 */
export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: boolean;
    role?: 'admin' | 'creator' | 'saas-admin';
    organizationId?: string;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

/**
 * User with populated organization
 */
export type UserWithOrganization = IUser & {
  organizationId?: IUser['organizationId'] & {
    name?: string;
    slug?: string;
  };
};

/**
 * Get the current session (server-side)
 * Cached per request to avoid multiple database calls
 * Uses React cache() to deduplicate requests within the same render
 */
export const getSession = cache(async (): Promise<Session | null> => {
  try {
    const headerList = await headers();
    const normalizedHeaders = new Headers();
    headerList.forEach((value: string, key: string) => {
      normalizedHeaders.append(key, value);
    });

    const session = await auth.api.getSession({
      headers: normalizedHeaders,
    });

    if (!session) {
      return null;
    }

    return session as Session;
  } catch (error) {
    logger.error({ error }, 'Failed to get session');
    return null;
  }
});

/**
 * Require authentication - throws error if not authenticated
 * @throws {Error} If user is not authenticated
 * @returns Session object if authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    const error = new Error('Unauthorized - Please sign in');
    error.name = 'UnauthorizedError';
    throw error;
  }

  return session;
}

/**
 * Require admin role
 * @throws {Error} If user is not authenticated or not an admin
 * @returns Session object if user is admin
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();

  if (session.user.role !== 'admin' && session.user.role !== 'saas-admin') {
    const error = new Error('Forbidden - Admin access required');
    error.name = 'ForbiddenError';
    throw error;
  }

  return session;
}

/**
 * Get user with full details from MongoDB
 * @param userId - The user ID to fetch
 * @returns User object with populated organization or null if not found
 */
export async function getUser(
  userId: string
): Promise<UserWithOrganization | null> {
  try {
    await ensureDbConnection();
    const user = await User.findById(userId)
      .populate('organizationId', 'name slug')
      .lean<UserWithOrganization>();

    if (!user) {
      logger.warn({ userId }, 'User not found');
      return null;
    }

    return user;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to get user');
    return null;
  }
}

/**
 * Check if user has access to organization
 * Cached per request to avoid duplicate queries
 * @param userId - The user ID to check
 * @param organizationId - The organization ID to check access for
 * @returns True if user has access, false otherwise
 */
export const hasOrganizationAccess = cache(async (
  userId: string,
  organizationId: string
): Promise<boolean> => {
  try {
    await ensureDbConnection();
    const user = await User.findById(userId)
      .select('role organizationId creatorProfile.projectId')
      .lean<{
        role: 'admin' | 'creator' | 'saas-admin';
        organizationId?: { toString(): string } | string;
        creatorProfile?: { projectId: { toString(): string } | string };
      }>();

    if (!user) {
      logger.warn({ userId }, 'User not found when checking organization access');
      return false;
    }

    // SaaS admins have access to all organizations
    if (user.role === 'saas-admin') {
      return true;
    }

    // Admin users have access to their organization
    const userOrgId =
      typeof user.organizationId === 'string'
        ? user.organizationId
        : user.organizationId?.toString();

    if (user.role === 'admin' && userOrgId === organizationId) {
      return true;
    }

    // Creator users have access through their project's organization
    // Optimized: Use exists() for faster check instead of fetching full document
    if (user.role === 'creator' && user.creatorProfile?.projectId) {
      const Project = (await import('@/lib/db/models/Project')).default;
      const projectId = typeof user.creatorProfile.projectId === 'string'
        ? user.creatorProfile.projectId
        : user.creatorProfile.projectId.toString();

      // Use exists() for faster existence check
      const projectExists = await Project.exists({
        _id: projectId,
        organizationId: organizationId,
      });

      return !!projectExists;
    }

    return false;
  } catch (error) {
    logger.error(
      { error, userId, organizationId },
      'Failed to check organization access'
    );
    return false;
  }
});

/**
 * Update user login tracking
 * Optimized to not fetch full document when not needed
 * @param userId - The user ID to track login for
 * @returns True if tracking was successful, false otherwise
 */
export function trackUserLogin(userId: string): void {
  queueMicrotask(async () => {
    try {
      await ensureDbConnection();
      await User.updateOne(
        { _id: userId },
        {
          $inc: { loginCount: 1 },
          $set: { lastLoginAt: new Date() },
        }
      );

      logger.info({ userId }, 'User login tracked');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to track user login');
    }
  });
}

/**
 * Password hashing configuration
 */
const PASSWORD_CONFIG = {
  SALT_ROUNDS: 10,
} as const;

/**
 * Hash a password using bcrypt
 * @param password - The plain text password to hash
 * @returns Hashed password
 * @throws {Error} If hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }

  try {
    return await bcrypt.hash(password, PASSWORD_CONFIG.SALT_ROUNDS);
  } catch (error) {
    logger.error({ error }, 'Failed to hash password');
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash
 * @param password - The plain text password to verify
 * @param hash - The hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error({ error }, 'Failed to verify password');
    return false;
  }
}