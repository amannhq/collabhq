import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Post, Metrics } from '@/lib/db/models';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('post-metrics-api');

export async function POST(
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

    const body = await request.json();
    const { likes, retweets, replies, impressions } = body;

    if (
      likes === undefined ||
      retweets === undefined ||
      replies === undefined ||
      impressions === undefined
    ) {
      return NextResponse.json(
        { success: false, error: 'All metrics fields required' },
        { status: 400 }
      );
    }

    const { postId } = await params;
    const post = await Post.findById(postId).populate('projectId');

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify access (creator or admin)
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

    // Get previous metrics for growth calculation
    const previousMetrics = await Metrics.findOne({ postId: post._id })
      .sort({ recordedAt: -1 })
      .lean() as { metrics: { likes?: number; retweets?: number; replies?: number; impressions?: number } } | null;

    const newMetrics = {
      likes,
      retweets,
      replies,
      impressions,
    };

    // Calculate growth
    let growth = {};
    if (previousMetrics) {
      growth = {
        likes: likes - (previousMetrics.metrics.likes || 0),
        retweets: retweets - (previousMetrics.metrics.retweets || 0),
        replies: replies - (previousMetrics.metrics.replies || 0),
        impressions: impressions - (previousMetrics.metrics.impressions || 0),
      };
    }

    // Create new metrics record
    const metricsRecord = await Metrics.create({
      postId: post._id,
      creatorId: post.creatorId,
      projectId: post.projectId._id,
      organizationId: post.projectId.organizationId,
      submittedBy: session.user.id,
      metrics: newMetrics,
      growth,
      recordedAt: new Date(),
    });

    // Update post's latest metrics
    post.latestMetrics = newMetrics;
    post.growth = growth;
    await post.save();

    logger.info(
      {
        postId,
        userId: session.user.id,
        metrics: newMetrics,
      },
      'Metrics updated'
    );

    return NextResponse.json({
      success: true,
      data: metricsRecord,
    });
  } catch (error) {
    logger.error({ error }, 'Error updating metrics');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get latest metrics
    const latestMetrics = await Metrics.findOne({ postId: post._id })
      .sort({ recordedAt: -1 })
      .lean();

    logger.info({ postId }, 'Latest metrics fetched');

    return NextResponse.json({
      success: true,
      data: latestMetrics || post.latestMetrics,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching metrics');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
