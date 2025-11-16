import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Invitation, User, Project, Organization } from '@/lib/db/models';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';
import { sendInvitationEmail } from '@/lib/services/email/email-service';
import { randomBytes } from 'crypto';

const logger = createLogger('creators-invite-api');

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, twitterHandle, projectId, message, organizationId } = body;

    // Validate required fields
    if (!name || !email || !projectId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // twitterHandle is required by the model
    if (!twitterHandle) {
      return NextResponse.json(
        { success: false, error: 'Twitter handle is required' },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email, organizationId });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get organization details for email
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get current user ID for invitedBy field
    const currentUser = await User.findOne({ 
      email: session.user.email,
      organizationId 
    });
    
    if (!currentUser) {
      logger.error({ email: session.user.email }, 'Current user not found');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation with correct structure matching the model
    const invitation = await Invitation.create({
      organizationId,
      projectId,
      email,
      invitedBy: currentUser._id, // REQUIRED field
      creatorData: {
        name,
        twitterHandle: twitterHandle.startsWith('@') ? twitterHandle.substring(1) : twitterHandle,
        role: 'creator',
        customMessage: message,
      },
      token,
      expiresAt,
      status: 'pending',
      emailDelivery: {
        sent: false,
        opens: 0,
        clicks: 0,
      },
      metadata: {
        inviteType: 'email',
        source: 'dashboard',
        reminderCount: 0,
      },
    });

    // Send invitation email
    try {
      await sendInvitationEmail({
        email,
        name,
        token,
        organizationId: organization._id.toString(),
        organizationName: organization.name,
        projectName: project.name,
        message,
      });
    } catch (emailError) {
      logger.error({ emailError, email }, 'Failed to send invitation email');
      // Don't fail the request if email fails - invitation is still created
    }

    logger.info(
      {
        invitationId: invitation._id.toString(),
        email,
        projectId,
        orgId: organizationId,
      },
      'Creator invitation sent'
    );

    return NextResponse.json({
      success: true,
      data: {
        _id: invitation._id.toString(),
        email: invitation.email,
        status: invitation.status,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error sending invitation');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
