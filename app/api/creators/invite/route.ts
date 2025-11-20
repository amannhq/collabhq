import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Invitation, User, Project, Organization } from '@/lib/db/models';
import { createLogger } from '@/lib/utils/logger';
import { sendInvitationEmail } from '@/lib/services/email/email-service';
import { randomBytes } from 'crypto';
import { CreatorInviteSchema } from '@/lib/api/validation';
import { withErrorHandler, NotFoundError, BadRequestError } from '@/lib/api/error-handler';
import { withAuth } from '@/lib/api/auth-middleware';

const logger = createLogger('creators-invite-api');

export const POST = withErrorHandler(withAuth(async (request: NextRequest, { user }) => {
  await connectDB();

  // Validate request body with Zod (HOF handles Zod errors automatically)
  const body = await request.json();
  const validatedData = CreatorInviteSchema.parse(body);
  const { name, email, twitterHandle, projectId, message, organizationId } = validatedData;

  // Check if user with this email already exists
  const existingUser = await User.findOne({ email, organizationId });
  if (existingUser) {
    throw BadRequestError('User with this email already exists');
  }

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    throw NotFoundError('Project');
  }

  // Get organization details for email
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw NotFoundError('Organization');
  }

  // Get current user for invitedBy field
  const currentUser = await User.findOne({
    email: user.email,
    organizationId
  });

  if (!currentUser) {
    logger.error({ email: user.email }, 'Current user not found');
    throw NotFoundError('User');
  }

  // Generate invitation token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create invitation with correct structure matching the model
  // Note: twitterHandle is already sanitized by Zod (@ prefix removed)
  const invitation = await Invitation.create({
    organizationId,
    projectId,
    email,
    invitedBy: currentUser._id, // REQUIRED field
    creatorData: {
      name,
      twitterHandle,
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
}));
