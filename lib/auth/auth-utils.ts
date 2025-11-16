// lib/auth/auth-utils.ts
import { auth } from "./betterauth";
import { headers } from "next/headers";
import { cache } from "react";
import { createLogger } from "@/lib/utils/logger";
import User from "@/lib/db/models/User";
import connectDB from "@/lib/db/mongodb";
import bcrypt from "bcryptjs";

const logger = createLogger('auth-utils');

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: boolean;
    role?: string;
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
 * Get the current session (server-side)
 * Cached per request to avoid multiple database calls
 */
export const getSession = cache(async (): Promise<Session | null> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
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
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized - Please sign in');
  }
  
  return session;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden - Admin access required');
  }
  
  return session;
}

/**
 * Get user with full details from MongoDB
 */
export async function getUser(userId: string) {
  try {
    await connectDB();
    const user = await User.findById(userId)
      .populate('organizationId')
      .lean();
    
    return user;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to get user');
    return null;
  }
}

/**
 * Check if user has access to organization
 */
export async function hasOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    await connectDB();
    const user = await User.findById(userId).lean() as {
      role: 'admin' | 'creator';
      organizationId?: { toString(): string };
      creatorProfile?: { projectId: { toString(): string } };
    } | null;
    
    if (!user) return false;
    
    // Admin users have access to their organization
    if (user.role === 'admin' && user.organizationId?.toString() === organizationId) {
      return true;
    }
    
    // Creator users have access through their project's organization
    if (user.role === 'creator' && user.creatorProfile?.projectId) {
      const Project = (await import('@/lib/db/models/Project')).default;
      const project = await Project.findById(user.creatorProfile.projectId).lean() as {
        organizationId?: { toString(): string };
      } | null;
      return project?.organizationId?.toString() === organizationId;
    }
    
    return false;
  } catch (error) {
    logger.error({ error, userId, organizationId }, 'Failed to check organization access');
    return false;
  }
}

/**
 * Update user login tracking
 */
export async function trackUserLogin(userId: string) {
  try {
    await connectDB();
    await User.findByIdAndUpdate(userId, {
      $inc: { loginCount: 1 },
      lastLoginAt: new Date(),
    });
    
    logger.info({ userId }, 'User login tracked');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to track user login');
  }
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}