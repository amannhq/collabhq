import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Post, Metrics } from '@/lib/db/models';
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

    // Get all approved posts for this creator
    const approvedPosts = await Post.find({
      creatorId,
      status: 'approved',
    })
      .select('_id latestMetrics growth createdAt approvedAt postUrl')
      .lean();

    const postIds = approvedPosts.map(p => p._id);

    // Get metrics history for date range
    const metricsHistory = await Metrics.find({
      postId: { $in: postIds },
      recordedAt: { $gte: startDate },
    })
      .select('postId metrics growth recordedAt')
      .sort({ recordedAt: 1 })
      .lean();

    // Calculate aggregate statistics
    const totalLikes = approvedPosts.reduce((sum, p) => sum + (p.latestMetrics?.likes || 0), 0);
    const totalRetweets = approvedPosts.reduce((sum, p) => sum + (p.latestMetrics?.retweets || 0), 0);
    const totalReplies = approvedPosts.reduce((sum, p) => sum + (p.latestMetrics?.replies || 0), 0);
    const totalImpressions = approvedPosts.reduce((sum, p) => sum + (p.latestMetrics?.impressions || 0), 0);
    const totalEngagement = totalLikes + totalRetweets + totalReplies;
    const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

    // Calculate average growth
    const avgLikesGrowth = approvedPosts.reduce((sum, p) => sum + (p.growth?.likes || 0), 0) / (approvedPosts.length || 1);
    const avgRetweetsGrowth = approvedPosts.reduce((sum, p) => sum + (p.growth?.retweets || 0), 0) / (approvedPosts.length || 1);
    const avgRepliesGrowth = approvedPosts.reduce((sum, p) => sum + (p.growth?.replies || 0), 0) / (approvedPosts.length || 1);
    const avgImpressionsGrowth = approvedPosts.reduce((sum, p) => sum + (p.growth?.impressions || 0), 0) / (approvedPosts.length || 1);

    // Find top performing posts
    const topPosts = approvedPosts
      .sort((a, b) => {
        const aEng = (a.latestMetrics?.likes || 0) + (a.latestMetrics?.retweets || 0) + (a.latestMetrics?.replies || 0);
        const bEng = (b.latestMetrics?.likes || 0) + (b.latestMetrics?.retweets || 0) + (b.latestMetrics?.replies || 0);
        return bEng - aEng;
      })
      .slice(0, 10);

    // Prepare chart data
    const chartData = metricsHistory.map(m => ({
      date: new Date(m.recordedAt).toISOString(),
      postId: m.postId.toString(),
      metrics: {
        likes: m.metrics.likes || 0,
        retweets: m.metrics.retweets || 0,
        replies: m.metrics.replies || 0,
        impressions: m.metrics.impressions || 0,
        engagement: (m.metrics.likes || 0) + (m.metrics.retweets || 0) + (m.metrics.replies || 0),
      },
      growth: m.growth,
    }));

    const analyticsData = {
      summary: {
        totalPosts: approvedPosts.length,
        totalEngagement,
        totalImpressions,
        engagementRate,
        averages: {
          likesPerPost: Math.round(totalLikes / (approvedPosts.length || 1)),
          retweetsPerPost: Math.round(totalRetweets / (approvedPosts.length || 1)),
          repliesPerPost: Math.round(totalReplies / (approvedPosts.length || 1)),
          impressionsPerPost: Math.round(totalImpressions / (approvedPosts.length || 1)),
        },
        growth: {
          likes: avgLikesGrowth,
          retweets: avgRetweetsGrowth,
          replies: avgRepliesGrowth,
          impressions: avgImpressionsGrowth,
        },
      },
      breakdown: {
        likes: totalLikes,
        retweets: totalRetweets,
        replies: totalReplies,
        impressions: totalImpressions,
      },
      topPosts: topPosts.map(p => ({
        id: String((p as { _id?: { toString(): string } })._id?.toString()),
        url: p.postUrl,
        metrics: p.latestMetrics,
        engagement: (p.latestMetrics?.likes || 0) + (p.latestMetrics?.retweets || 0) + (p.latestMetrics?.replies || 0),
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
        postsCount: approvedPosts.length, 
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
