import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('creator-detail-api');

export async function GET(
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

    const resolvedParams = await params;
    const creator = await User.findById(resolvedParams.creatorId)
      .select('-password')
      .lean();

    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: creator,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching creator');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const resolvedParams = await params;
    const body = await request.json();
    const { name, email, twitterHandle } = body;

    const creator = await User.findByIdAndUpdate(
      resolvedParams.creatorId,
      { name, email, twitterHandle },
      { new: true }
    ).select('-password');

    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }

    logger.info(
      {
        creatorId: creator._id.toString(),
      },
      'Creator updated'
    );

    return NextResponse.json({
      success: true,
      data: creator,
    });
  } catch (error) {
    logger.error({ error }, 'Error updating creator');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const resolvedParams = await params;
    const creator = await User.findByIdAndDelete(resolvedParams.creatorId);

    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }

    logger.info(
      {
        creatorId: resolvedParams.creatorId,
      },
      'Creator deleted'
    );

    return NextResponse.json({
      success: true,
      data: { message: 'Creator deleted successfully' },
    });
  } catch (error) {
    logger.error({ error }, 'Error deleting creator');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
