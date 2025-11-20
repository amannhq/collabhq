import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Post, Metrics, Organization, type IOrganization } from '@/lib/db/models';
import { requireAuth } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('post-analytics-api');

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
    const postId = searchParams.get('postId');
    const organizationId = searchParams.get('organizationId');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (!postId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'Post ID and Organization ID required' },
        { status: 400 }
      );
    }

    // OPTIMIZED: Parallel queries for organization and post
    const [organization, post] = await Promise.all([
      Organization.findById(organizationId)
        .select('_id ownerId')
        .lean<IOrganization>(),
      Post.findById(postId)
        .select('postUrl caption status createdAt approvedAt projectId creatorId')
        .populate('creatorId', 'name email twitterHandle')
        .populate('projectId', 'name organizationId')
        .lean() as Promise<{
          _id: { toString(): string };
          postUrl: string;
          caption?: string;
          status: string;
          createdAt: Date;
          approvedAt?: Date;
          projectId?: {
            _id: { toString(): string };
            organizationId?: { toString(): string };
            name?: string;
          };
          creatorId: {
            name: string;
            email: string;
            twitterHandle?: string;
          };
        } | null>
    ]);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify post belongs to organization
    if (post.projectId?.organizationId?.toString() !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse date range
    const startDate = fromParam ? new Date(fromParam) : null;
    const endDate = toParam ? new Date(toParam) : null;

    // Build metrics query with optional date filtering
    const metricsMatch: { postId: string; recordedAt?: { $gte?: Date; $lte?: Date } } = { postId };
    if (startDate || endDate) {
      metricsMatch.recordedAt = {};
      if (startDate) metricsMatch.recordedAt.$gte = startDate;
      if (endDate) metricsMatch.recordedAt.$lte = endDate;
    }

    // OPTIMIZED: Use aggregation to calculate metrics on database side + parallel project comparison
    const [metricsAggregation, engagementOverTime, projectComparison] = await Promise.all([
      // Single aggregation to get all summary stats
      Metrics.aggregate([
        { $match: metricsMatch },
        { $sort: { recordedAt: 1 } },
        {
          $group: {
            _id: null,
            totalMetrics: { $sum: 1 },
            lastLikes: { $last: '$metrics.likes' },
            lastRetweets: { $last: '$metrics.retweets' },
            lastReplies: { $last: '$metrics.replies' },
            lastImpressions: { $last: '$metrics.impressions' },
            maxEngagement: {
              $max: {
                $add: [
                  { $ifNull: ['$metrics.likes', 0] },
                  { $ifNull: ['$metrics.retweets', 0] },
                  { $ifNull: ['$metrics.replies', 0] }
                ]
              }
            },
            firstEngagement: {
              $first: {
                $add: [
                  { $ifNull: ['$metrics.likes', 0] },
                  { $ifNull: ['$metrics.retweets', 0] },
                  { $ifNull: ['$metrics.replies', 0] }
                ]
              }
            },
            lastEngagement: {
              $last: {
                $add: [
                  { $ifNull: ['$metrics.likes', 0] },
                  { $ifNull: ['$metrics.retweets', 0] },
                  { $ifNull: ['$metrics.replies', 0] }
                ]
              }
            }
          }
        }
      ]),
      // Get timeline data with limit
      Metrics.find(metricsMatch)
        .select('recordedAt metrics')
        .sort({ recordedAt: 1 })
        .limit(1000) // Reasonable limit for charts
        .lean(),
      // Parallel: Get project average for comparison
      post.projectId?._id ? Post.aggregate([
        {
          $match: {
            projectId: post.projectId._id,
            _id: { $ne: postId },
            createdAt: { $gte: post.createdAt },
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            avgEngagement: {
              $avg: {
                $add: [
                  { $ifNull: ['$latestMetrics.likes', 0] },
                  { $ifNull: ['$latestMetrics.retweets', 0] },
                  { $ifNull: ['$latestMetrics.replies', 0] }
                ]
              }
            },
            count: { $sum: 1 }
          }
        }
      ]) : Promise.resolve([])
    ]);

    const metricsStats = metricsAggregation[0] || {
      totalMetrics: 0,
      lastLikes: 0,
      lastRetweets: 0,
      lastReplies: 0,
      lastImpressions: 0,
      maxEngagement: 0,
      firstEngagement: 0,
      lastEngagement: 0
    };

    const totalLikes = metricsStats.lastLikes || 0;
    const totalRetweets = metricsStats.lastRetweets || 0;
    const totalReplies = metricsStats.lastReplies || 0;
    const totalImpressions = metricsStats.lastImpressions || 0;
    const totalEngagement = totalLikes + totalRetweets + totalReplies;
    const maxEngagement = metricsStats.maxEngagement || 0;

    // Calculate engagement breakdown
    const engagementBreakdown = {
      likes: totalLikes,
      retweets: totalRetweets,
      replies: totalReplies,
      likesPercent: totalEngagement > 0 ? (totalLikes / totalEngagement) * 100 : 0,
      retweetsPercent: totalEngagement > 0 ? (totalRetweets / totalEngagement) * 100 : 0,
      repliesPercent: totalEngagement > 0 ? (totalReplies / totalEngagement) * 100 : 0,
    };

    // Calculate overall growth
    const overallGrowth = metricsStats.firstEngagement > 0
      ? ((metricsStats.lastEngagement - metricsStats.firstEngagement) / metricsStats.firstEngagement) * 100
      : 0;

    // Calculate engagement rate
    const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

    // Process timeline data with growth calculations
    const engagementOverTimeData = engagementOverTime.map((m, index) => {
      const likes = m.metrics?.likes || 0;
      const retweets = m.metrics?.retweets || 0;
      const replies = m.metrics?.replies || 0;
      const impressions = m.metrics?.impressions || 0;
      const engagement = likes + retweets + replies;

      // Calculate growth since previous metric
      let growth = 0;
      if (index > 0) {
        const prevMetrics = engagementOverTime[index - 1];
        const prevEngagement = (prevMetrics.metrics?.likes || 0) +
                               (prevMetrics.metrics?.retweets || 0) +
                               (prevMetrics.metrics?.replies || 0);
        if (prevEngagement > 0) {
          growth = ((engagement - prevEngagement) / prevEngagement) * 100;
        }
      }

      return {
        date: m.recordedAt,
        likes,
        retweets,
        replies,
        impressions,
        engagement,
        growth: Math.round(growth * 10) / 10,
      };
    });

    // Get project comparison
    const avgProjectEngagement = projectComparison[0]?.avgEngagement || 0;
    const comparisonVsAvg = avgProjectEngagement > 0
      ? ((totalEngagement - avgProjectEngagement) / avgProjectEngagement) * 100
      : 0;

    const analytics = {
      post: {
        _id: post._id,
        postUrl: post.postUrl,
        caption: post.caption,
        status: post.status,
        createdAt: post.createdAt,
        approvedAt: post.approvedAt,
        projectName: post.projectId.name,
        creatorName: post.creatorId.name,
        creatorEmail: post.creatorId.email,
        creatorHandle: post.creatorId.twitterHandle,
      },
      currentMetrics: {
        likes: totalLikes,
        retweets: totalRetweets,
        replies: totalReplies,
        impressions: totalImpressions,
        totalEngagement,
        engagementRate: Math.round(engagementRate * 100) / 100,
      },
      engagementBreakdown,
      engagementOverTime: engagementOverTimeData,
      insights: {
        totalDataPoints: metricsStats.totalMetrics,
        overallGrowth: Math.round(overallGrowth * 10) / 10,
        maxEngagement,
        avgEngagement: metricsStats.totalMetrics > 0
          ? Math.round(totalEngagement / metricsStats.totalMetrics)
          : 0,
        comparisonVsProjectAvg: Math.round(comparisonVsAvg * 10) / 10,
        performanceBenchmark: comparisonVsAvg > 0 ? 'Above Average' :
                              comparisonVsAvg === 0 ? 'Average' : 'Below Average',
      },
    };

    logger.info(
      { postId, orgId: organizationId, userId: session.user.id },
      'Post analytics fetched'
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching post analytics');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
