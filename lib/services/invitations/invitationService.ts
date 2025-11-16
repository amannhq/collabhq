import { randomBytes } from 'crypto';
import connectDB from '@/lib/db/mongodb';
import { Invitation, User } from '@/lib/db/models';
import { sendEmail } from '@/lib/services/email/email-service';
import { InvitationEmail } from '@/lib/services/email/templates/InvitationEmail';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('invitation-service');

interface CreateInvitationParams {
  email: string;
  name: string;
  organizationId: string;
  projectId: string;
  invitedBy: string;
  role?: 'creator' | 'admin';
  twitterHandle?: string;
}

interface VerifyInvitationResult {
  valid: boolean;
  invitation?: {
    _id: { toString(): string };
    email: string;
    token: string;
    status: 'pending' | 'accepted' | 'expired';
    organizationId: { toString(): string; _id: { toString(): string }; slug: string };
    projectId: { toString(): string; _id: { toString(): string } };
    expiresAt: Date;
    role?: 'admin' | 'creator';
    metadata?: { twitterHandle?: string };
  };
  error?: string;
}

/**
 * Create a new invitation
 */
export async function createInvitation(params: CreateInvitationParams) {
  try {
    await connectDB();

    const {
      email,
      name,
      organizationId,
      projectId,
      invitedBy,
      role = 'creator',
      twitterHandle,
    } = params;

    logger.info(
      { email, organizationId, projectId, role },
      'Creating invitation'
    );

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      logger.warn({ email }, 'User already exists with this email');
      throw new Error('User with this email already exists');
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await Invitation.findOne({
      email,
      organizationId,
      status: 'pending',
    }).lean();

    if (existingInvitation) {
      logger.warn({ email, organizationId }, 'Pending invitation already exists');
      throw new Error('Pending invitation already exists for this email');
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await Invitation.create({
      email,
      name,
      organizationId,
      projectId,
      invitedBy,
      role,
      token,
      expiresAt,
      status: 'pending',
      metadata: twitterHandle ? { twitterHandle } : undefined,
    });

    logger.info(
      { invitationId: invitation._id, email, expiresAt },
      'Invitation created successfully'
    );

    // Send invitation email
    try {
      await sendInvitationEmail(invitation);
      logger.info({ invitationId: invitation._id, email }, 'Invitation email sent');
    } catch (emailError) {
      logger.error(
        { error: emailError, invitationId: invitation._id },
        'Failed to send invitation email'
      );
      // Don't throw - invitation is created, just log the email failure
    }

    return {
      success: true,
      data: invitation,
    };
  } catch (error) {
    logger.error({ error, params }, 'Failed to create invitation');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invitation',
    };
  }
}

/**
 * Verify invitation token
 */
export async function verifyInvitation(
  token: string
): Promise<VerifyInvitationResult> {
  try {
    await connectDB();

    logger.info({ token: token.substring(0, 8) + '...' }, 'Verifying invitation');

    const invitation = await Invitation.findOne({ token })
      .populate('organizationId', 'name slug')
      .populate('projectId', 'name')
      .populate('invitedBy', 'name email')
      .lean() as {
      _id: { toString(): string };
      email: string;
      token: string;
      status: 'pending' | 'accepted' | 'expired';
      organizationId: { toString(): string; _id: { toString(): string }; slug: string };
      projectId: { toString(): string; _id: { toString(): string } };
      expiresAt: Date;
      role?: 'admin' | 'creator';
      metadata?: { twitterHandle?: string };
    } | null;

    if (!invitation) {
      logger.warn({ token: token.substring(0, 8) + '...' }, 'Invitation not found');
      return {
        valid: false,
        error: 'Invalid invitation link',
      };
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      logger.warn({ invitationId: invitation._id }, 'Invitation already accepted');
      return {
        valid: false,
        error: 'This invitation has already been accepted',
      };
    }

    // Check if expired
    if (new Date() > new Date(invitation.expiresAt)) {
      logger.warn(
        { invitationId: invitation._id, expiresAt: invitation.expiresAt },
        'Invitation expired'
      );
      await Invitation.findByIdAndUpdate(invitation._id, { status: 'expired' });
      return {
        valid: false,
        error: 'This invitation has expired',
      };
    }

    logger.info({ invitationId: invitation._id }, 'Invitation verified successfully');

    return {
      valid: true,
      invitation,
    };
  } catch (error) {
    logger.error({ error, token: token.substring(0, 8) + '...' }, 'Error verifying invitation');
    return {
      valid: false,
      error: 'Failed to verify invitation',
    };
  }
}

/**
 * Accept invitation and create user account
 */
export async function acceptInvitation(token: string, userId: string) {
  try {
    await connectDB();

    logger.info({ token: token.substring(0, 8) + '...', userId }, 'Accepting invitation');

    // Verify invitation first
    const verification = await verifyInvitation(token);
    if (!verification.valid || !verification.invitation) {
      return {
        success: false,
        error: verification.error || 'Invalid invitation',
      };
    }

    const invitation = verification.invitation;

    // Update user with organization and project
    await User.findByIdAndUpdate(userId, {
      organizationId: invitation.organizationId,
      role: invitation.role,
      twitterHandle: invitation.metadata?.twitterHandle,
    });

    // Mark invitation as accepted
    await Invitation.findByIdAndUpdate(invitation._id, {
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedBy: userId,
    });

    logger.info(
      { invitationId: invitation._id, userId },
      'Invitation accepted successfully'
    );

    return {
      success: true,
      data: {
        organizationId: invitation.organizationId._id.toString(),
        organizationSlug: invitation.organizationId.slug,
        projectId: invitation.projectId._id.toString(),
      },
    };
  } catch (error) {
    logger.error({ error, token: token.substring(0, 8) + '...' }, 'Failed to accept invitation');
    return {
      success: false,
      error: 'Failed to accept invitation',
    };
  }
}

/**
 * Resend invitation email
 */
export async function resendInvitation(invitationId: string) {
  try {
    await connectDB();

    logger.info({ invitationId }, 'Resending invitation');

    let invitation = await Invitation.findById(invitationId)
      .populate('organizationId', 'name slug')
      .populate('projectId', 'name')
      .lean() as {
      _id: { toString(): string };
      email: string;
      name: string;
      token: string;
      status: string;
      organizationId: { _id: { toString(): string }; name: string; slug: string };
      projectId: { _id: { toString(): string }; name: string };
      expiresAt: Date;
    } | null;

    if (!invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      };
    }

    if (invitation.status !== 'pending') {
      return {
        success: false,
        error: 'Can only resend pending invitations',
      };
    }

    // Check if expired and extend if needed
    if (new Date() > new Date(invitation.expiresAt)) {
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      await Invitation.findByIdAndUpdate(invitationId, {
        expiresAt: newExpiresAt,
        status: 'pending',
      });

      // Update local variable
      invitation = { ...invitation, expiresAt: newExpiresAt };
      logger.info({ invitationId, newExpiresAt }, 'Extended invitation expiry');
    }

    // Send email
    await sendInvitationEmail(invitation);

    logger.info({ invitationId }, 'Invitation resent successfully');

    return {
      success: true,
      data: invitation,
    };
  } catch (error) {
    logger.error({ error, invitationId }, 'Failed to resend invitation');
    return {
      success: false,
      error: 'Failed to resend invitation',
    };
  }
}

/**
 * Delete/cancel invitation
 */
export async function cancelInvitation(invitationId: string) {
  try {
    await connectDB();

    logger.info({ invitationId }, 'Canceling invitation');

    const invitation = await Invitation.findByIdAndDelete(invitationId);

    if (!invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      };
    }

    logger.info({ invitationId }, 'Invitation canceled successfully');

    return {
      success: true,
    };
  } catch (error) {
    logger.error({ error, invitationId }, 'Failed to cancel invitation');
    return {
      success: false,
      error: 'Failed to cancel invitation',
    };
  }
}

/**
 * Get all invitations for an organization
 */
export async function getOrganizationInvitations(organizationId: string) {
  try {
    await connectDB();

    const invitations = await Invitation.find({ organizationId })
      .populate('projectId', 'name')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: invitations,
    };
  } catch (error) {
    logger.error({ error, organizationId }, 'Failed to fetch invitations');
    return {
      success: false,
      error: 'Failed to fetch invitations',
    };
  }
}

/**
 * Send invitation email (internal helper)
 */
async function sendInvitationEmail(invitation: {
  email: string;
  name: string;
  token: string;
  organizationId: { _id: { toString(): string }; name: string };
  projectId: { _id: { toString(): string }; name: string };
  message?: string;
}) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;

  await sendEmail({
    to: invitation.email,
    subject: `You're invited to join ${invitation.organizationId.name}`,
    react: InvitationEmail({
      name: invitation.name,
      organizationName: invitation.organizationId.name,
      projectName: invitation.projectId.name,
      inviteUrl,
    }),
  });
}
