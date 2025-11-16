import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('activate-creator-api');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can activate creators
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;

    // Update creator status to active
    const creator = await User.findByIdAndUpdate(
      resolvedParams.creatorId,
      {
        'creatorProfile.status': 'active',
        'creatorProfile.activatedAt': new Date(),
      },
      { new: true }
    ).select('-password');

    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Verify creator belongs to same organization
    if (creator.organizationId?.toString() !== session.user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Creator not in your organization' },
        { status: 403 }
      );
    }

    logger.info(
      {
        creatorId: creator._id.toString(),
        activatedBy: session.user.id,
      },
      'Creator activated'
    );

    // TODO: Send notification to creator about activation
    // TODO: Log activity in ActivityLog model

    return NextResponse.json({
      success: true,
      data: creator,
    });
  } catch (error) {
    logger.error({ error }, 'Error activating creator');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
