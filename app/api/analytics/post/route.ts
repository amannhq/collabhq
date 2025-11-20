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

    // Verify organization access
    const organization = await Organization.findById(organizationId).lean<IOrganization>();
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get post details
    const post = await Post.findById(postId)
      .populate('creatorId', 'name email twitterHandle')
      .populate('projectId', 'name organizationId')
      .lean() as {
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
      } | null;

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
    const metricsQuery: { postId: string; recordedAt?: { $gte?: Date; $lte?: Date } } = { postId };
    if (startDate || endDate) {
      metricsQuery.recordedAt = {};
      if (startDate) metricsQuery.recordedAt.$gte = startDate;
      if (endDate) metricsQuery.recordedAt.$lte = endDate;
    }

    // Get metrics history
    const metricsHistory = await Metrics.find(metricsQuery)
      .sort({ recordedAt: 1 })
      .lean();

    // Calculate analytics from metrics
    const totalMetrics = metricsHistory.length;

    let totalLikes = 0;
    let totalRetweets = 0;
    let totalReplies = 0;
    let totalImpressions = 0;
    let maxEngagement = 0;

    const engagementOverTime = metricsHistory.map((m, index) => {
      const likes = m.metrics?.likes || 0;
      const retweets = m.metrics?.retweets || 0;
      const replies = m.metrics?.replies || 0;
      const impressions = m.metrics?.impressions || 0;
      const engagement = likes + retweets + replies;

      totalLikes = likes;
      totalRetweets = retweets;
      totalReplies = replies;
      totalImpressions = impressions;

      if (engagement > maxEngagement) {
        maxEngagement = engagement;
      }

      // Calculate growth since previous metric
      let growth = 0;
      if (index > 0) {
        const prevMetrics = metricsHistory[index - 1];
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

    // Calculate engagement breakdown
    const totalEngagement = totalLikes + totalRetweets + totalReplies;
    const engagementBreakdown = {
      likes: totalLikes,
      retweets: totalRetweets,
      replies: totalReplies,
      likesPercent: totalEngagement > 0 ? (totalLikes / totalEngagement) * 100 : 0,
      retweetsPercent: totalEngagement > 0 ? (totalRetweets / totalEngagement) * 100 : 0,
      repliesPercent: totalEngagement > 0 ? (totalReplies / totalEngagement) * 100 : 0,
    };

    // Calculate growth rate (first to last in period)
    let overallGrowth = 0;
    if (metricsHistory.length >= 2) {
      const firstMetrics = metricsHistory[0];
      const lastMetrics = metricsHistory[metricsHistory.length - 1];

      const firstEngagement = (firstMetrics.metrics?.likes || 0) +
                              (firstMetrics.metrics?.retweets || 0) +
                              (firstMetrics.metrics?.replies || 0);
      const lastEngagement = (lastMetrics.metrics?.likes || 0) +
                             (lastMetrics.metrics?.retweets || 0) +
                             (lastMetrics.metrics?.replies || 0);

      if (firstEngagement > 0) {
        overallGrowth = ((lastEngagement - firstEngagement) / firstEngagement) * 100;
      }
    }

    // Calculate engagement rate
    const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

    // Get average metrics for comparison (same project, same time period)
    const projectPosts = post.projectId?._id ? await Post.find({
      projectId: post.projectId._id,
      _id: { $ne: postId },
      createdAt: { $gte: post.createdAt },
    }).lean() : [];

    let avgProjectEngagement = 0;
    if (projectPosts.length > 0) {
      const totalProjectEngagement = projectPosts.reduce((sum, p) => {
        const post = p as { latestMetrics?: { likes?: number; retweets?: number; replies?: number } };
        return sum +
          (post.latestMetrics?.likes || 0) +
          (post.latestMetrics?.retweets || 0) +
          (post.latestMetrics?.replies || 0);
      }, 0);

      avgProjectEngagement = totalProjectEngagement / projectPosts.length;
    }

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
      engagementOverTime,
      insights: {
        totalDataPoints: totalMetrics,
        overallGrowth: Math.round(overallGrowth * 10) / 10,
        maxEngagement,
        avgEngagement: metricsHistory.length > 0
          ? Math.round(totalEngagement / metricsHistory.length)
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
