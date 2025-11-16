import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Organization, Project, Post, User, type IOrganization } from '@/lib/db/models';
import { requireAuth } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('org-stats-api');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await connectDB();
    const session = await requireAuth();

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

    // Get all statistics
    const [
      totalProjects,
      activeProjects,
      totalCreators,
      activeCreators,
      totalPosts,
      approvedPosts,
      pendingPosts,
      rejectedPosts,
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
      Post.countDocuments({ organizationId: orgId, status: 'rejected' }),
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

    const stats = {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: await Project.countDocuments({ organizationId: orgId, status: 'completed' }),
        archived: await Project.countDocuments({ organizationId: orgId, status: 'archived' }),
      },
      creators: {
        total: totalCreators,
        active: activeCreators,
        invited: await User.countDocuments({
          organizationId: orgId,
          role: 'creator',
          'creatorProfile.status': 'invited',
        }),
        suspended: await User.countDocuments({
          organizationId: orgId,
          role: 'creator',
          'creatorProfile.status': 'suspended',
        }),
      },
      posts: {
        total: totalPosts,
        approved: approvedPosts,
        pending: pendingPosts,
        rejected: rejectedPosts,
      },
      engagement: {
        total: totalEngagement,
        impressions: totalImpressions,
        averagePerPost: approvedPosts > 0 ? Math.round(totalEngagement / approvedPosts) : 0,
      },
    };

    logger.info({ orgId, userId: session.user.id }, 'Organization stats fetched');

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching organization stats');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
