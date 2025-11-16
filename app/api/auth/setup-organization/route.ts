import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import connectDB from '@/lib/db/mongodb';
import { Organization, User } from '@/lib/db/models';
import { auth } from '@/lib/auth/betterauth';
import { extractCompanyFromEmail } from '@/lib/utils/email-validation';
import { initializeDefaultTemplates } from '@/lib/utils/email-template-utils';

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

    // Check if user's email is verified
    if (!session.user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email not verified' },
        { status: 403 }
      );
    }

    await connectDB();

    // Check if user already has organization
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

    // Generate unique slug
    const baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (await Organization.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create organization
    const organization = await Organization.create({
      name: companyName,
      slug,
      ownerId: userId,
      settings: {
        notificationEmail: userEmail,
      },
      subscription: {
        plan: 'free',
        status: 'trial',
        startDate: new Date(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      },
    });

    // Update user with organizationId
    await User.findByIdAndUpdate(userId, {
      organizationId: organization._id,
    });

    logger.info(
      {
        userId,
        organizationId: organization._id.toString(),
        slug,
      },
      'Organization created after email verification'
    );

    // Initialize default email templates
    try {
      await initializeDefaultTemplates(
        organization._id.toString(),
        {
          primaryColor: organization.settings?.primaryColor,
          secondaryColor: organization.settings?.secondaryColor,
          logoUrl: organization.settings?.logo,
        }
      );
      logger.info(
        { organizationId: organization._id.toString() },
        'Default email templates initialized'
      );
    } catch (templateError) {
      logger.error(
        { error: templateError, organizationId: organization._id.toString() },
        'Failed to initialize default email templates'
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId: organization._id.toString(),
        slug: organization.slug,
        name: organization.name,
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
