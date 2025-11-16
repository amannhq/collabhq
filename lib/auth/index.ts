// lib/auth/index.ts
/**
 * Central export for all authentication utilities
 */

// Server-side
export {
  getSession,
  requireAuth,
  requireAdmin,
  getUser,
  hasOrganizationAccess,
  trackUserLogin,
  hashPassword,
  verifyPassword,
  type Session,
} from './auth-utils';

// Better Auth instance
export { auth } from './betterauth';

// Client-side (re-export for convenience)
export { authClient, useSession } from './client';
