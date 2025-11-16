import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Invitation, User, Organization } from '@/lib/db/models';
import { createLogger } from '@/lib/utils/logger';
import { auth } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/services/email/email-service';
import crypto from 'crypto';

const logger = createLogger('creators-accept-api');

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
    }).populate('organizationId').populate('projectId');

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check expiration
    if (invitation.isExpired()) {
      await Invitation.findByIdAndUpdate(invitation._id, { status: 'expired' });
      return NextResponse.json(
        { success: false, error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const temporaryPassword = crypto.randomBytes(16).toString('hex');

    // Create user account with Better Auth
    const user = await auth.api.signUpEmail({
      body: {
        email: invitation.email,
        password: temporaryPassword,
        name: invitation.creatorData.name,
      },
    });

    if (!user) {
      throw new Error('Failed to create user account');
    }

    // Update user with creator profile
    await User.findOneAndUpdate(
      { email: invitation.email },
      {
        organizationId: invitation.organizationId,
        role: 'creator',
        creatorProfile: {
          twitterHandle: invitation.creatorData.twitterHandle,
          projectId: invitation.projectId,
          status: 'active',
          invitedBy: invitation.invitedBy,
          invitedAt: invitation.createdAt,
          activatedAt: new Date(),
          stats: {
            totalPosts: 0,
            approvedPosts: 0,
            pendingPosts: 0,
            totalLikes: 0,
            totalRetweets: 0,
            totalImpressions: 0,
            avgEngagementRate: 0,
          },
        },
        emailVerified: true,
      }
    );

    // Update invitation status
    await invitation.markAsAccepted(user.user.id);

    // Get organization for welcome email
    const organization = await Organization.findById(invitation.organizationId);
    
    // Send welcome email with temporary password
    if (organization) {
      try {
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
        await sendWelcomeEmail({
          email: invitation.email,
          name: invitation.creatorData.name,
          organizationId: organization._id.toString(),
          organizationName: organization.name,
          projectName: invitation.projectId.name,
          temporaryPassword,
          dashboardUrl,
        });
      } catch (emailError) {
        logger.error({ emailError, email: invitation.email }, 'Failed to send welcome email');
        // Don't fail the request if email fails
      }
    }

    logger.info(
      {
        userId: user.user.id,
        email: invitation.email,
        orgId: invitation.organizationId.toString(),
      },
      'Creator accepted invitation'
    );

    return NextResponse.json({
      success: true,
      data: {
        message: 'Invitation accepted! Check your email for login credentials.',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error accepting invitation');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
