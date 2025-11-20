import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Post } from '@/lib/db/models';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('analytics-creator-api');

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session?.user) {
      logger.warn({ endpoint: '/api/analytics/creator' }, 'Unauthorized access attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only creators can access this endpoint
    if (session.user.role !== 'creator') {
      logger.warn(
        { userId: session.user.id, role: session.user.role, endpoint: '/api/analytics/creator' },
        'Non-creator attempted to access creator analytics'
      );
      return NextResponse.json(
        { success: false, error: 'Forbidden - Creator access only' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');
    const range = searchParams.get('range') || '30d';

    // Validate creatorId matches session user
    if (creatorId !== session.user.id) {
      logger.warn(
        { userId: session.user.id, requestedCreatorId: creatorId },
        'Creator attempted to access another creator\'s analytics'
      );
      return NextResponse.json(
        { success: false, error: 'Forbidden - Can only access your own analytics' },
        { status: 403 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // OPTIMIZED: Use aggregation to calculate statistics + parallel queries
    const [aggregateStats, topPosts, metricsHistory] = await Promise.all([
      // Single aggregation for all summary statistics
      Post.aggregate([
        {
          $match: {
            creatorId,
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            totalLikes: { $sum: { $ifNull: ['$latestMetrics.likes', 0] } },
            totalRetweets: { $sum: { $ifNull: ['$latestMetrics.retweets', 0] } },
            totalReplies: { $sum: { $ifNull: ['$latestMetrics.replies', 0] } },
            totalImpressions: { $sum: { $ifNull: ['$latestMetrics.impressions', 0] } },
            avgLikesGrowth: { $avg: { $ifNull: ['$growth.likes', 0] } },
            avgRetweetsGrowth: { $avg: { $ifNull: ['$growth.retweets', 0] } },
            avgRepliesGrowth: { $avg: { $ifNull: ['$growth.replies', 0] } },
            avgImpressionsGrowth: { $avg: { $ifNull: ['$growth.impressions', 0] } }
          }
        }
      ]),
      // Get top performing posts with engagement calculated in DB
      Post.aggregate([
        {
          $match: {
            creatorId,
            status: 'approved'
          }
        },
        {
          $addFields: {
            totalEngagement: {
              $add: [
                { $ifNull: ['$latestMetrics.likes', 0] },
                { $ifNull: ['$latestMetrics.retweets', 0] },
                { $ifNull: ['$latestMetrics.replies', 0] }
              ]
            }
          }
        },
        { $sort: { totalEngagement: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 1,
            postUrl: 1,
            latestMetrics: 1,
            totalEngagement: 1,
            createdAt: 1
          }
        }
      ]),
      // Get metrics history (with limit for performance)
      Post.aggregate([
        {
          $match: {
            creatorId,
            status: 'approved'
          }
        },
        {
          $lookup: {
            from: 'metrics',
            let: { postId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$postId', '$$postId'] },
                  recordedAt: { $gte: startDate }
                }
              },
              { $sort: { recordedAt: 1 } },
              { $limit: 100 } // Limit per post for performance
            ],
            as: 'metricsData'
          }
        },
        { $unwind: '$metricsData' },
        {
          $project: {
            postId: '$_id',
            recordedAt: '$metricsData.recordedAt',
            metrics: '$metricsData.metrics',
            growth: '$metricsData.growth'
          }
        },
        { $sort: { recordedAt: 1 } }
      ])
    ]);

    const stats = aggregateStats[0] || {
      totalPosts: 0,
      totalLikes: 0,
      totalRetweets: 0,
      totalReplies: 0,
      totalImpressions: 0,
      avgLikesGrowth: 0,
      avgRetweetsGrowth: 0,
      avgRepliesGrowth: 0,
      avgImpressionsGrowth: 0
    };

    const totalEngagement = stats.totalLikes + stats.totalRetweets + stats.totalReplies;
    const engagementRate = stats.totalImpressions > 0 ? (totalEngagement / stats.totalImpressions) * 100 : 0;

    // Prepare chart data
    const chartData = metricsHistory.map(m => ({
      date: new Date(m.recordedAt).toISOString(),
      postId: m.postId.toString(),
      metrics: {
        likes: m.metrics?.likes || 0,
        retweets: m.metrics?.retweets || 0,
        replies: m.metrics?.replies || 0,
        impressions: m.metrics?.impressions || 0,
        engagement: (m.metrics?.likes || 0) + (m.metrics?.retweets || 0) + (m.metrics?.replies || 0),
      },
      growth: m.growth,
    }));

    const analyticsData = {
      summary: {
        totalPosts: stats.totalPosts,
        totalEngagement,
        totalImpressions: stats.totalImpressions,
        engagementRate,
        averages: {
          likesPerPost: Math.round(stats.totalLikes / (stats.totalPosts || 1)),
          retweetsPerPost: Math.round(stats.totalRetweets / (stats.totalPosts || 1)),
          repliesPerPost: Math.round(stats.totalReplies / (stats.totalPosts || 1)),
          impressionsPerPost: Math.round(stats.totalImpressions / (stats.totalPosts || 1)),
        },
        growth: {
          likes: stats.avgLikesGrowth,
          retweets: stats.avgRetweetsGrowth,
          replies: stats.avgRepliesGrowth,
          impressions: stats.avgImpressionsGrowth,
        },
      },
      breakdown: {
        likes: stats.totalLikes,
        retweets: stats.totalRetweets,
        replies: stats.totalReplies,
        impressions: stats.totalImpressions,
      },
      topPosts: topPosts.map(p => ({
        id: String(p._id?.toString()),
        url: p.postUrl,
        metrics: p.latestMetrics,
        engagement: p.totalEngagement,
        createdAt: p.createdAt,
      })),
      chartData,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
        range,
      },
    };

    logger.info(
      {
        creatorId,
        range,
        postsCount: stats.totalPosts,
        metricsCount: metricsHistory.length
      },
      'Creator analytics retrieved successfully'
    );

    return NextResponse.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    logger.error({ error, endpoint: '/api/analytics/creator' }, 'Failed to fetch creator analytics');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
