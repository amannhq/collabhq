import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Post, Metrics } from '@/lib/db/models';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('post-metrics-history-api');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await connectDB();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    const { postId } = await params;
    const post = await Post.findById(postId).populate('projectId');

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify access
    const { Organization } = await import('@/lib/db/models');
    const organization = await Organization.findById(
      post.projectId.organizationId
    );

    const isAdmin =
      organization && organization.ownerId.toString() === session.user.id;
    const isCreator = post.creatorId.toString() === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get metrics history
    const metricsHistory = await Metrics.find({ postId: post._id })
      .sort({ recordedAt: -1 })
      .limit(limit)
      .lean();

    logger.info(
      { postId, count: metricsHistory.length },
      'Metrics history fetched'
    );

    return NextResponse.json({
      success: true,
      data: metricsHistory.reverse(), // Return oldest to newest for charts
    });
  } catch (error) {
    logger.error(
      { error },
      'Error fetching metrics history'
    );
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
