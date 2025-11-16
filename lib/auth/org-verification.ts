/**
 * Organization verification utilities
 * Optimized with caching to reduce database queries
 */

import { unstable_cache } from 'next/cache';
import connectDB from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';

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
    await connectDB();
    
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
    console.error('Error verifying organization access:', error);
    return null;
  }
}

/**
 * Cached version - revalidates every 5 minutes
 * Use this in server components for better performance
 */
export const getCachedOrganizationAccess = unstable_cache(
  async (orgSlug: string, userId: string) => {
    return verifyOrganizationAccess(orgSlug, userId);
  },
  ['org-access'],
  {
    revalidate: 300, // 5 minutes
    tags: ['organization'],
  }
);
