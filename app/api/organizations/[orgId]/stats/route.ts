import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Organization, Project, Post, User, type IOrganization } from '@/lib/db/models';
import { getSession } from '@/lib/auth/auth-utils';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('org-stats-api');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;
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

    // Get all statistics in parallel
    const [
      totalProjects,
      activeProjects,
      totalCreators,
      activeCreators,
      totalPosts,
      approvedPosts,
      pendingPosts,
      recentPosts,
    ] = await Promise.all([
      Project.countDocuments({ organizationId: orgId }),
      Project.countDocuments({ organizationId: orgId, status: 'active' }),
      User.countDocuments({ organizationId: orgId, role: 'creator' }),
      User.countDocuments({
        organizationId: orgId,
        role: 'creator',
        'creatorProfile.status': 'active',
      }),
      Post.countDocuments({ organizationId: orgId }),
      Post.countDocuments({ organizationId: orgId, status: 'approved' }),
      Post.countDocuments({ organizationId: orgId, status: 'pending' }),
      Post.find({ organizationId: orgId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('creatorId', 'name email')
        .populate('projectId', 'name')
        .lean(),
    ]);

    // Calculate engagement
    const posts = await Post.find({
      organizationId: orgId,
      status: 'approved',
    })
      .select('latestMetrics')
      .lean();

    const totalEngagement = posts.reduce((sum, post) => {
      const metrics = post.latestMetrics || {};
      return sum + (metrics.likes || 0) + (metrics.retweets || 0) + (metrics.replies || 0);
    }, 0);

    const totalImpressions = posts.reduce((sum, post) => {
      return sum + (post.latestMetrics?.impressions || 0);
    }, 0);

    // Calculate growth data for charts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chartData = await Post.aggregate([
      {
        $match: {
          organizationId: organization._id,
          status: 'approved',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          likes: { $sum: '$latestMetrics.likes' },
          retweets: { $sum: '$latestMetrics.retweets' },
          replies: { $sum: '$latestMetrics.replies' },
          impressions: { $sum: '$latestMetrics.impressions' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const stats = {
      totalProjects,
      activeProjects,
      totalCreators,
      activeCreators,
      totalPosts,
      approvedPosts,
      pendingPosts,
      totalEngagement,
      totalImpressions,
    };

    logger.info({ orgId, userId: session.user.id }, 'Organization stats fetched');

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentPosts,
        chartData,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching organization stats');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
