import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Project, Post, User, Organization, type IOrganization } from '@/lib/db/models';
import { requireAuth } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('project-analytics-api');

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
    const projectId = searchParams.get('projectId');
    const organizationId = searchParams.get('organizationId');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (!projectId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'Project ID and Organization ID required' },
        { status: 400 }
      );
    }

    const organization = await Organization.findById(organizationId).lean<IOrganization>();

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

    const project = await Project.findById(projectId);

    if (!project || project.organizationId.toString() !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Parse date range
    const startDate = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = toParam ? new Date(toParam) : new Date();

    // Get current period posts
    const currentPosts = await Post.find({
      projectId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    // Get previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = startDate;

    const previousPosts = await Post.find({
      projectId,
      createdAt: { $gte: prevStartDate, $lt: prevEndDate },
    }).lean();

    // Calculate metrics
    const totalPosts = currentPosts.length;
    const previousTotalPosts = previousPosts.length;
    const postsGrowth = previousTotalPosts > 0
      ? ((totalPosts - previousTotalPosts) / previousTotalPosts) * 100
      : 0;

    const totalEngagement = currentPosts.reduce(
      (sum, p) =>
        sum +
        (p.latestMetrics?.likes || 0) +
        (p.latestMetrics?.retweets || 0) +
        (p.latestMetrics?.replies || 0),
      0
    );

    const previousEngagement = previousPosts.reduce(
      (sum, p) =>
        sum +
        (p.latestMetrics?.likes || 0) +
        (p.latestMetrics?.retweets || 0) +
        (p.latestMetrics?.replies || 0),
      0
    );

    const engagementGrowth = previousEngagement > 0
      ? ((totalEngagement - previousEngagement) / previousEngagement) * 100
      : 0;

    const totalImpressions = currentPosts.reduce(
      (sum, p) => sum + (p.latestMetrics?.impressions || 0),
      0
    );

    const avgEngagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

    // Get timeline data
    const timeline = await Post.aggregate([
      {
        $match: {
          projectId: project._id,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          posts: { $sum: 1 },
          engagement: {
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
          engagement: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Get creator performance
    const creators = await Post.aggregate([
      {
        $match: {
          projectId: project._id,
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$creatorId',
          posts: { $sum: 1 },
          engagement: {
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
          posts: 1,
          engagement: 1,
          _id: 0,
        },
      },
      { $sort: { engagement: -1 } },
      { $limit: 10 },
    ]);

    const analytics = {
      metrics: {
        totalPosts,
        totalEngagement,
        totalImpressions,
        avgEngagementRate,
        postsGrowth,
        engagementGrowth,
      },
      timeline,
      creators,
    };

    logger.info(
      { projectId, orgId: organizationId, userId: session.user.id },
      'Project analytics fetched'
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching project analytics');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
