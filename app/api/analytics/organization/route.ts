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
    const type = searchParams.get('type'); // engagement-timeline, posts-by-project, top-creators, growth-trends
    const sortBy = searchParams.get('sortBy') || 'engagement';
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

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

    // Parse date range
    const startDate = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = toParam ? new Date(toParam) : new Date();

    let data: unknown;

    // Handle specific chart data requests
    if (type === 'engagement-timeline') {
      data = await getEngagementTimeline(organization._id, startDate, endDate);
    } else if (type === 'posts-by-project') {
      data = await getPostsByProject(organization._id, startDate, endDate);
    } else if (type === 'top-creators') {
      data = await getTopCreators(organization._id, startDate, endDate, sortBy);
    } else if (type === 'growth-trends') {
      data = await getGrowthTrends(organization._id, startDate, endDate);
    } else {
      // Default: return summary metrics
      data = await getSummaryMetrics(organization._id, startDate, endDate);
    }

    logger.info(
      { orgId, userId: session.user.id, type },
      'Organization analytics fetched'
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching organization analytics');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getEngagementTimeline(orgId: unknown, startDate: Date, endDate: Date) {
  const metrics = await Metrics.aggregate([
    {
      $match: {
        organizationId: orgId,
        recordedAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' },
        },
        likes: { $sum: '$metrics.likes' },
        comments: { $sum: '$metrics.replies' },
        shares: { $sum: '$metrics.retweets' },
      },
    },
    {
      $project: {
        date: '$_id',
        likes: 1,
        comments: 1,
        shares: 1,
        _id: 0,
      },
    },
    { $sort: { date: 1 } },
  ]);

  return metrics;
}

async function getPostsByProject(orgId: unknown, startDate: Date, endDate: Date) {
  const posts = await Post.aggregate([
    {
      $match: {
        organizationId: orgId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'approved',
      },
    },
    {
      $group: {
        _id: '$projectId',
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'projects',
        localField: '_id',
        foreignField: '_id',
        as: 'project',
      },
    },
    {
      $unwind: '$project',
    },
    {
      $project: {
        name: '$project.name',
        value: '$count',
        _id: 0,
      },
    },
    { $sort: { value: -1 } },
  ]);

  return posts;
}

async function getTopCreators(
  orgId: unknown,
  startDate: Date,
  endDate: Date,
  sortBy: string
) {
  const matchStage = {
    $match: {
      organizationId: orgId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'approved',
    },
  };

  const groupStage = {
    $group: {
      _id: '$creatorId',
      postCount: { $sum: 1 },
      totalLikes: { $sum: '$latestMetrics.likes' },
      totalRetweets: { $sum: '$latestMetrics.retweets' },
      totalReplies: { $sum: '$latestMetrics.replies' },
      totalImpressions: { $sum: '$latestMetrics.impressions' },
    },
  };

  const creators = await Post.aggregate([
    matchStage,
    groupStage,
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        name: '$user.name',
        value: sortBy === 'posts' ? '$postCount' : {
          $add: ['$totalLikes', '$totalRetweets', '$totalReplies']
        },
        _id: 0,
      },
    },
    { $sort: { value: -1 } },
    { $limit: 10 },
  ]);

  return creators;
}

async function getGrowthTrends(orgId: unknown, startDate: Date, endDate: Date) {
  const trends = await Post.aggregate([
    {
      $match: {
        organizationId: orgId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'approved',
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        posts: { $sum: 1 },
        creators: { $addToSet: '$creatorId' },
        totalEngagement: {
          $sum: {
            $add: [
              '$latestMetrics.likes',
              '$latestMetrics.retweets',
              '$latestMetrics.replies',
            ],
          },
        },
      },
    },
    {
      $project: {
        date: '$_id',
        posts: 1,
        creators: { $size: '$creators' },
        engagement: '$totalEngagement',
        _id: 0,
      },
    },
    { $sort: { date: 1 } },
  ]);

  return trends;
}

async function getSummaryMetrics(orgId: unknown, startDate: Date, endDate: Date) {
  // Get current period posts
  const currentPosts = await Post.find({
    organizationId: orgId,
    createdAt: { $gte: startDate, $lte: endDate },
    status: 'approved',
  }).lean();

  // Get previous period for comparison
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodLength);
  const prevEndDate = startDate;

  const previousPosts = await Post.find({
    organizationId: orgId,
    createdAt: { $gte: prevStartDate, $lt: prevEndDate },
    status: 'approved',
  }).lean();

  // Calculate metrics
  const totalPosts = currentPosts.length;
  const previousTotalPosts = previousPosts.length;
  const postsGrowth = previousTotalPosts > 0
    ? ((totalPosts - previousTotalPosts) / previousTotalPosts) * 100
    : 0;

  const activeCreators = new Set(currentPosts.map((p) => p.creatorId?.toString())).size;
  const previousActiveCreators = new Set(previousPosts.map((p) => p.creatorId?.toString())).size;
  const creatorsGrowth = previousActiveCreators > 0
    ? ((activeCreators - previousActiveCreators) / previousActiveCreators) * 100
    : 0;

  const totalImpressions = currentPosts.reduce(
    (sum, p) => sum + (p.latestMetrics?.impressions || 0),
    0
  );
  const previousImpressions = previousPosts.reduce(
    (sum, p) => sum + (p.latestMetrics?.impressions || 0),
    0
  );
  const impressionsGrowth = previousImpressions > 0
    ? ((totalImpressions - previousImpressions) / previousImpressions) * 100
    : 0;

  const totalEngagement = currentPosts.reduce(
    (sum, p) =>
      sum +
      (p.latestMetrics?.likes || 0) +
      (p.latestMetrics?.retweets || 0) +
      (p.latestMetrics?.replies || 0),
    0
  );
  const avgEngagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

  const previousEngagement = previousPosts.reduce(
    (sum, p) =>
      sum +
      (p.latestMetrics?.likes || 0) +
      (p.latestMetrics?.retweets || 0) +
      (p.latestMetrics?.replies || 0),
    0
  );
  const prevAvgEngagementRate =
    previousImpressions > 0 ? (previousEngagement / previousImpressions) * 100 : 0;
  const engagementGrowth = prevAvgEngagementRate > 0
    ? ((avgEngagementRate - prevAvgEngagementRate) / prevAvgEngagementRate) * 100
    : 0;

  return {
    totalPosts,
    postsGrowth,
    activeCreators,
    creatorsGrowth,
    totalImpressions,
    impressionsGrowth,
    avgEngagementRate,
    engagementGrowth,
  };
}
