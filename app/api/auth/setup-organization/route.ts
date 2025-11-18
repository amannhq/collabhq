import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { ensureDbConnection } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models';
import { auth } from '@/lib/auth/betterauth';
import { createOrganizationForUser } from '@/lib/auth/organization-helpers';
import { extractCompanyFromEmail } from '@/lib/utils/email-validation';

const logger = createLogger('setup-organization-api');

/**
 * Create organization for user after email verification
 * POST /api/auth/setup-organization
 */
export async function POST(request: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    await ensureDbConnection();

    // Note: We trust that the client only calls this after successful email verification
    // The verifyEmail endpoint sets emailVerified to true before this is called
    logger.info({ userId, emailVerified: session.user.emailVerified }, 'Setting up organization');

    // Check if user already has organization in Mongoose User model
    const existingUser = await User.findById(userId).lean() as { organizationId?: string } | null;
    if (existingUser?.organizationId) {
      logger.info({ userId, organizationId: existingUser.organizationId }, 'User already has organization');
      return NextResponse.json({
        success: true,
        data: { organizationId: existingUser.organizationId },
        message: 'Organization already exists',
      });
    }

    // Extract company name from email
    const companyName = extractCompanyFromEmail(userEmail);
    if (!companyName) {
      return NextResponse.json(
        { success: false, error: 'Could not extract company name from email' },
        { status: 400 }
      );
    }

    const organizationResult = await createOrganizationForUser(
      userId,
      userEmail,
      companyName
    );

    if (!organizationResult) {
      logger.error({ userId }, 'Failed to create organization for user');
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create organization. Please try again.',
        },
        { status: 500 }
      );
    }

    logger.info(
      {
        userId,
        organizationId: organizationResult.organizationId,
        slug: organizationResult.slug,
      },
      'Organization created after email verification'
    );

    // Fetch organization name (helper already returns name)
    return NextResponse.json({
      success: true,
      data: {
        organizationId: organizationResult.organizationId,
        slug: organizationResult.slug,
        name: organizationResult.name,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to setup organization');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup organization',
      },
      { status: 500 }
    );
  }
}
