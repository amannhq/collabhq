import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Project, Post, Organization, type IOrganization } from '@/lib/db/models';
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

    // Parse date range (default to last 30 days) with precise timestamps
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of day

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of day

    const startDate = fromParam ? new Date(fromParam) : thirtyDaysAgo;
    const endDate = toParam ? new Date(toParam) : today;

    // Set start of day for startDate and end of day for endDate
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Helper function to fill missing dates
    const fillMissingDates = (data: Array<{ date: string; posts: number; engagement: number; impressions: number }>, fromDate: Date, toDate: Date) => {
      const dateMap = new Map(data.map(item => [item.date, item]));
      const result = [];

      // Use local date handling to avoid timezone issues
      const currentDate = new Date(fromDate);
      currentDate.setHours(0, 0, 0, 0);

      const endDate = new Date(toDate);
      endDate.setHours(0, 0, 0, 0);

      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        if (dateMap.has(dateStr)) {
          result.push(dateMap.get(dateStr));
        } else {
          result.push({
            date: dateStr,
            posts: 0,
            likes: 0,
            retweets: 0,
            replies: 0,
            impressions: 0,
            engagement: 0,
            engagementRate: 0,
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    };

    // Get current period posts for this project only
    const currentPosts = await Post.find({
      projectId: project._id,
      status: 'approved',
      postedAt: { $gte: startDate, $lte: endDate },
    }).lean();

    // Get previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = startDate;

    const previousPosts = await Post.find({
      projectId: project._id,
      status: 'approved',
      postedAt: { $gte: prevStartDate, $lt: prevEndDate },
    }).lean();

    // Calculate current period stats
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
        (p.latestMetrics?.replies || 0) +
        (p.latestMetrics?.quotes || 0),
      0
    );

    const previousEngagement = previousPosts.reduce(
      (sum, p) =>
        sum +
        (p.latestMetrics?.likes || 0) +
        (p.latestMetrics?.retweets || 0) +
        (p.latestMetrics?.replies || 0) +
        (p.latestMetrics?.quotes || 0),
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

    // Get daily timeline data from Post collection with latestMetrics
    const timelineData = await Post.aggregate([
      {
        $match: {
          projectId: project._id,
          status: 'approved',
          postedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$postedAt' },
          },
          postCount: { $addToSet: '$_id' },
          likes: { $sum: { $ifNull: ['$latestMetrics.likes', 0] } },
          retweets: { $sum: { $ifNull: ['$latestMetrics.retweets', 0] } },
          replies: { $sum: { $ifNull: ['$latestMetrics.replies', 0] } },
          quotes: { $sum: { $ifNull: ['$latestMetrics.quotes', 0] } },
          impressions: { $sum: { $ifNull: ['$latestMetrics.impressions', 0] } },
        },
      },
      {
        $project: {
          date: '$_id',
          posts: { $size: '$postCount' },
          likes: 1,
          retweets: 1,
          replies: 1,
          quotes: 1,
          impressions: 1,
          engagement: {
            $add: ['$likes', '$retweets', '$replies', { $ifNull: ['$quotes', 0] }]
          },
          engagementRate: {
            $cond: [
              { $gt: ['$impressions', 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ['$likes', '$retweets', '$replies', { $ifNull: ['$quotes', 0] }] },
                      '$impressions'
                    ]
                  },
                  100
                ]
              },
              0
            ]
          },
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Fill missing dates to ensure complete timeline
    const timeline = fillMissingDates(timelineData, startDate, endDate);

    // Get creator performance based on their posts (within date range)
    const creatorPerformance = await Post.aggregate([
      {
        $match: {
          projectId: project._id,
          status: 'approved',
          postedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$creatorId',
          posts: { $sum: 1 },
          totalImpressions: { $sum: { $ifNull: ['$latestMetrics.impressions', 0] } },
          engagement: {
            $sum: {
              $add: [
                { $ifNull: ['$latestMetrics.likes', 0] },
                { $ifNull: ['$latestMetrics.retweets', 0] },
                { $ifNull: ['$latestMetrics.replies', 0] },
                { $ifNull: ['$latestMetrics.quotes', 0] },
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
          totalImpressions: 1,
          engagement: 1,
          engagementRate: {
            $cond: [
              { $gt: ['$totalImpressions', 0] },
              { $multiply: [{ $divide: ['$engagement', '$totalImpressions'] }, 100] },
              0
            ]
          },
          _id: 0,
        },
      },
      { $sort: { engagement: -1 } },
      { $limit: 10 },
    ]);

    // Get engagement breakdown from current period posts
    const engagementBreakdown = {
      totalLikes: currentPosts.reduce((sum, p) => sum + (p.latestMetrics?.likes || 0), 0),
      totalRetweets: currentPosts.reduce((sum, p) => sum + (p.latestMetrics?.retweets || 0), 0),
      totalReplies: currentPosts.reduce((sum, p) => sum + (p.latestMetrics?.replies || 0), 0),
      totalQuotes: currentPosts.reduce((sum, p) => sum + (p.latestMetrics?.quotes || 0), 0),
    };

    // Get top posts in this period (within date range)
    const topPosts = await Post.aggregate([
      {
        $match: {
          projectId: project._id,
          status: 'approved',
          postedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $addFields: {
          totalEngagement: {
            $add: [
              { $ifNull: ['$latestMetrics.likes', 0] },
              { $ifNull: ['$latestMetrics.retweets', 0] },
              { $ifNull: ['$latestMetrics.replies', 0] },
              { $ifNull: ['$latestMetrics.quotes', 0] },
            ],
          },
        },
      },
      { $sort: { totalEngagement: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'creatorId',
          foreignField: '_id',
          as: 'creator',
        },
      },
      {
        $unwind: '$creator',
      },
      {
        $project: {
          postUrl: 1,
          caption: 1,
          creatorName: '$creator.name',
          likes: '$latestMetrics.likes',
          retweets: '$latestMetrics.retweets',
          replies: '$latestMetrics.replies',
          quotes: '$latestMetrics.quotes',
          impressions: '$latestMetrics.impressions',
          engagement: '$totalEngagement',
          engagementRate: {
            $cond: [
              { $gt: ['$latestMetrics.impressions', 0] },
              { $multiply: [{ $divide: ['$totalEngagement', '$latestMetrics.impressions'] }, 100] },
              0
            ]
          },
        },
      },
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
      creators: creatorPerformance,
      engagementBreakdown,
      topPosts,
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
