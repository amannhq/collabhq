import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Invitation from '@/lib/db/models/Invitation';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('invitations-decline-api');

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();

    const { token } = await params;

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

    // Update invitation status
    await Invitation.findByIdAndUpdate(invitation._id, {
      status: 'cancelled',
    });

    logger.info(
      {
        invitationId: invitation._id.toString(),
        email: invitation.email,
      },
      'Invitation declined'
    );

    return NextResponse.json({
      success: true,
      data: {
        message: 'Invitation declined',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error declining invitation');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
