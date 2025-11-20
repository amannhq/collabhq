/**
 * Organization verification utilities
 * Optimized with caching to reduce database queries
 */

import { unstable_cache } from 'next/cache';
import { ensureDbConnection } from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('org-verification');

interface OrgVerificationResult {
  organizationId: string;
  isOwner: boolean;
  organization: IOrganization | null;
}

/**
 * Verify user owns organization by slug
 * Cached for 5 minutes to reduce DB queries
 */
export async function verifyOrganizationAccess(
  orgSlug: string,
  userId: string
): Promise<OrgVerificationResult | null> {
  try {
    await ensureDbConnection();

    const organization = await Organization.findOne({ slug: orgSlug })
      .select('_id ownerId name slug')
      .lean<IOrganization>();

    if (!organization) {
      return null;
    }

    const isOwner = organization.ownerId.toString() === userId;

    return {
      organizationId: organization._id.toString(),
      isOwner,
      organization,
    };
  } catch (error) {
    logger.error(
      { error, orgSlug, userId },
      'Error verifying organization access'
    );
    return null;
  }
}

/**
 * Cached version - revalidates every 5 minutes
 * Use this in server components for better performance
 */
export function getCachedOrganizationAccess(
  orgSlug: string,
  userId: string
): Promise<OrgVerificationResult | null> {
  return unstable_cache(
    async () => verifyOrganizationAccess(orgSlug, userId),
    ['org-access', orgSlug, userId],
    {
      revalidate: 300, // 5 minutes
      tags: [`organization:${orgSlug}`],
    }
  )();
}
