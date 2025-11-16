import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Organization, Post, Metrics, type IOrganization } from '@/lib/db/models';
import { requireAuth } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('org-analytics-api');

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await requireAuth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organizationId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID required' },
        { status: 400 }
      );
    }

    const organization = await Organization.findById(orgId).lean<IOrganization>();

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check access
    if (organization.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get time-series data
    const metricsData = await Metrics.aggregate([
      {
        $match: {
          organizationId: organization._id,
          recordedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' },
          },
          likes: { $sum: '$likes' },
          retweets: { $sum: '$retweets' },
          replies: { $sum: '$replies' },
          impressions: { $sum: '$impressions' },
          posts: { $addToSet: '$postId' },
        },
      },
      {
        $project: {
          date: '$_id',
          likes: 1,
          retweets: 1,
          replies: 1,
          impressions: 1,
          postCount: { $size: '$posts' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Get top performing posts
    const topPosts = await Post.find({
      organizationId: organization._id,
      status: 'approved',
    })
      .sort({ 'latestMetrics.impressions': -1 })
      .limit(10)
      .populate('creatorId', 'name email twitterHandle')
      .populate('projectId', 'name')
      .lean();

    // Get creator performance
    const creatorPerformance = await Post.aggregate([
      {
        $match: {
          organizationId: organization._id,
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$creatorId',
          postCount: { $sum: 1 },
          totalLikes: { $sum: '$latestMetrics.likes' },
          totalRetweets: { $sum: '$latestMetrics.retweets' },
          totalReplies: { $sum: '$latestMetrics.replies' },
          totalImpressions: { $sum: '$latestMetrics.impressions' },
        },
      },
      { $sort: { totalImpressions: -1 } },
      { $limit: 10 },
    ]);

    // Get project performance
    const projectPerformance = await Post.aggregate([
      {
        $match: {
          organizationId: organization._id,
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$projectId',
          postCount: { $sum: 1 },
          totalLikes: { $sum: '$latestMetrics.likes' },
          totalRetweets: { $sum: '$latestMetrics.retweets' },
          totalReplies: { $sum: '$latestMetrics.replies' },
          totalImpressions: { $sum: '$latestMetrics.impressions' },
        },
      },
      { $sort: { totalImpressions: -1 } },
    ]);

    const analytics = {
      timeSeries: metricsData,
      topPosts,
      creatorPerformance,
      projectPerformance,
    };

    logger.info(
      { orgId, userId: session.user.id, days },
      'Organization analytics fetched'
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching organization analytics');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
