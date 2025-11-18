// lib/auth/organization-helpers.ts
/**
 * Helper functions for organization creation and management
 * Extracted from betterauth.ts to reduce duplication and improve maintainability
 */

import { MongoServerError } from 'mongodb';
import { createLogger } from '@/lib/utils/logger';
import { ensureDbConnection } from '@/lib/db/mongodb';
import Organization from '@/lib/db/models/Organization';
import type { IOrganization } from '@/lib/db/models/Organization';
import User from '@/lib/db/models/User';
import { extractCompanyFromEmail } from '@/lib/utils/email-validation';
import { initializeDefaultTemplates } from '@/lib/utils/email-template-utils';

const logger = createLogger('organization-helpers');

/**
 * Constants for organization creation
 */
export const ORGANIZATION_CONSTANTS = {
  TRIAL_DAYS: 14,
  DEFAULT_PLAN: 'free' as const,
  DEFAULT_STATUS: 'trial' as const,
} as const;

const SLUG_BATCH_SIZE = Number(process.env.ORG_SLUG_BATCH_SIZE) || 10;
const ORG_CREATE_MAX_RETRIES = Number(process.env.ORG_CREATE_MAX_RETRIES) || 3;

/**
 * Generate a unique slug from company name
 * Optimized to reduce database queries by checking multiple slugs at once
 * @param companyName - The company name to generate slug from
 * @returns A unique slug
 */
export async function generateUniqueSlug(companyName: string): Promise<string> {
  const baseSlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // First check if base slug is available (most common case)
  const baseExists = await Organization.exists({ slug: baseSlug });
  if (!baseExists) {
    return baseSlug;
  }

  // If base exists, check multiple slugs in batches to reduce queries
  let counter = 1;
  const batchSize = SLUG_BATCH_SIZE;
  
  while (true) {
    // Generate batch of slugs to check
    const slugsToCheck = Array.from({ length: batchSize }, (_, i) => 
      `${baseSlug}-${counter + i}`
    );

    // Check taken slugs in a single query returning distinct values
    const existingSlugs = await Organization.distinct('slug', {
      slug: { $in: slugsToCheck },
    });

    const existingSet = new Set(existingSlugs);

    // Find first available slug in batch
    for (const slug of slugsToCheck) {
      if (!existingSet.has(slug)) {
        return slug;
      }
    }

    // All slugs in batch exist, move to next batch
    counter += batchSize;
  }
}

/**
 * Get company name from user data or email
 * @param user - User object with optional companyName
 * @param email - User email address
 * @returns Company name or null
 */
export function getCompanyName(
  user: { companyName?: string } | null,
  email: string
): string | null {
  if (user?.companyName) {
    return user.companyName;
  }
  return extractCompanyFromEmail(email);
}

/**
 * Create organization for a user
 * @param userId - The user ID
 * @param email - User email address
 * @param companyName - Optional company name (will be extracted from email if not provided)
 * @returns Created organization data or null if failed
 */
export async function createOrganizationForUser(
  userId: string,
  email: string,
  companyName?: string
): Promise<{ organizationId: string; slug: string; name: string } | null> {
  try {
    await ensureDbConnection();

    // Get company name
    const finalCompanyName = companyName || extractCompanyFromEmail(email);
    if (!finalCompanyName) {
      logger.warn({ userId, email }, 'Could not extract company name from email');
      return null;
    }

    const expiresAt = new Date(
      Date.now() + ORGANIZATION_CONSTANTS.TRIAL_DAYS * 24 * 60 * 60 * 1000
    );

    let organization: IOrganization | null = null;
    let slug: string | null = null;

    for (let attempt = 0; attempt < ORG_CREATE_MAX_RETRIES; attempt++) {
      slug = await generateUniqueSlug(finalCompanyName);

      try {
        organization = await Organization.create<IOrganization>({
          name: finalCompanyName,
          slug,
          ownerId: userId,
          settings: {
            notificationEmail: email,
          },
          subscription: {
            plan: ORGANIZATION_CONSTANTS.DEFAULT_PLAN,
            status: ORGANIZATION_CONSTANTS.DEFAULT_STATUS,
            startDate: new Date(),
            expiresAt,
          },
        });
        break;
      } catch (error) {
        const isDuplicateSlug =
          error instanceof MongoServerError && error.code === 11000;

        if (isDuplicateSlug && attempt < ORG_CREATE_MAX_RETRIES - 1) {
          logger.warn(
            { userId, attempt, slug, error: error.message },
            'Slug collision detected, retrying organization creation'
          );
          continue;
        }

        throw error;
      }
    }

    if (!organization || !slug) {
      throw new Error('Failed to create organization after multiple attempts');
    }

    // Update user with organizationId (must happen after org creation)
    await User.findByIdAndUpdate(userId, {
      organizationId: organization._id,
    });

    logger.info(
      {
        userId,
        organizationId: organization._id.toString(),
        slug,
      },
      'Organization created successfully'
    );

    // Initialize default email templates asynchronously (non-blocking)
    // Fire and forget - don't wait for completion
    void initializeDefaultTemplates(organization._id.toString(), {
      primaryColor: organization.settings?.primaryColor,
      secondaryColor: organization.settings?.secondaryColor,
      logoUrl: organization.settings?.logo,
    })
      .then(() => {
        logger.info(
          { organizationId: organization._id.toString() },
          'Default email templates initialized'
        );
      })
      .catch((templateError) => {
        logger.error(
          {
            error: templateError,
            organizationId: organization._id.toString(),
          },
          'Failed to initialize default email templates'
        );
        // Don't throw - organization is created, templates can be created later
      });

    return {
      organizationId: organization._id.toString(),
      slug,
      name: organization.name,
    };
  } catch (error) {
    logger.error(
      { error, userId, email },
      'Failed to create organization for user'
    );
    // Don't throw - user is already created, we can handle org creation separately
    return null;
  }
}

/**
 * Check if user already has an organization
 * Optimized to use exists() for faster queries (only checks existence, doesn't fetch document)
 * @param userId - The user ID to check
 * @returns True if user has organization, false otherwise
 */
export async function userHasOrganization(userId: string): Promise<boolean> {
  try {
    await ensureDbConnection();
    // Use exists() instead of findOne() - faster as it only checks existence
    const user = await User.exists({ 
      _id: userId, 
      organizationId: { $exists: true, $ne: null } 
    });
    return !!user;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to check if user has organization');
    return false;
  }
}

