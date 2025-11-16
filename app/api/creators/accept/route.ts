import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Invitation, User, Organization } from '@/lib/db/models';
import { createLogger } from '@/lib/utils/logger';
import { hashPassword } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/services/email/email-service';

const logger = createLogger('creators-accept-api');

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check expiration
    if (new Date() > invitation.expiresAt) {
      await Invitation.findByIdAndUpdate(invitation._id, { status: 'expired' });
      return NextResponse.json(
        { success: false, error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Create user account
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name: invitation.name,
      email: invitation.email,
      password: hashedPassword,
      organizationId: invitation.organizationId,
      role: 'creator',
      creatorProfile: {
        twitterHandle: invitation.twitterHandle || '',
        projectId: invitation.projectId,
        status: 'active',
        invitedBy: invitation.organizationId,
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
    });

    // Update invitation status
    await Invitation.findByIdAndUpdate(invitation._id, {
      status: 'accepted',
      acceptedAt: new Date(),
    });

    // Get organization for welcome email
    const organization = await Organization.findById(invitation.organizationId);
    
    // Send welcome email
    if (organization) {
      try {
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/creator/${user._id.toString()}`;
        await sendWelcomeEmail({
          email: user.email,
          name: user.name,
          organizationId: organization._id.toString(),
          organizationName: organization.name,
          dashboardUrl,
        });
      } catch (emailError) {
        logger.error({ emailError, email: user.email }, 'Failed to send welcome email');
        // Don't fail the request if email fails
      }
    }

    logger.info(
      {
        userId: user._id.toString(),
        email: user.email,
        orgId: invitation.organizationId.toString(),
      },
      'Creator accepted invitation'
    );

    return NextResponse.json({
      success: true,
      data: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
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
