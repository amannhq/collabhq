import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Organization, Post, type IOrganization } from '@/lib/db/models';
import { getSession } from '@/lib/auth/auth-utils';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('detailed-analytics-api');

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID required' },
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

    // Date range setup
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const from = fromDate ? new Date(fromDate) : thirtyDaysAgo;
    const to = toDate ? new Date(toDate) : new Date();

    // ==================================================
    // 1. TIME-SERIES METRICS (Daily aggregation)
    // Use Post collection with latestMetrics for real-time data
    // ==================================================
    const dailyMetrics = await Post.aggregate([
      {
        $match: {
          organizationId: organization._id,
          status: 'approved',
          postedAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$postedAt' } },
          impressions: { $sum: { $ifNull: ['$latestMetrics.impressions', 0] } },
          likes: { $sum: { $ifNull: ['$latestMetrics.likes', 0] } },
          retweets: { $sum: { $ifNull: ['$latestMetrics.retweets', 0] } },
          replies: { $sum: { $ifNull: ['$latestMetrics.replies', 0] } },
          quotes: { $sum: { $ifNull: ['$latestMetrics.quotes', 0] } },
          bookmarks: { $sum: { $ifNull: ['$latestMetrics.bookmarks', 0] } },
          views: { $sum: { $ifNull: ['$latestMetrics.views', 0] } },
          uniquePosts: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          date: '$_id',
          impressions: 1,
          likes: 1,
          retweets: 1,
          replies: 1,
          quotes: 1,
          bookmarks: 1,
          views: 1,
          totalEngagement: {
            $add: ['$likes', '$retweets', '$replies', { $ifNull: ['$quotes', 0] }]
          },
          postCount: { $size: '$uniquePosts' },
          engagementRate: {
            $cond: {
              if: { $gt: ['$impressions', 0] },
              then: {
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
              else: 0
            }
          }
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Fill in missing dates with zero values to ensure complete timeline
    const fillMissingDates = (data: Array<{ date: string; posts: number; engagement: number; impressions: number; engagementRate: number }>, fromDate: Date, toDate: Date) => {
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
            impressions: 0,
            likes: 0,
            retweets: 0,
            replies: 0,
            quotes: 0,
            bookmarks: 0,
            views: 0,
            totalEngagement: 0,
            postCount: 0,
            engagementRate: 0,
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    };

    const completeDailyMetrics = fillMissingDates(dailyMetrics, from, to);

    // ==================================================
    // 2. PROJECT PERFORMANCE COMPARISON
    // ==================================================
    const projectPerformance = await Post.aggregate([
      {
        $match: {
          organizationId: organization._id,
          status: 'approved',
          postedAt: { $gte: from, $lte: to },
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'project',
        },
      },
      { $unwind: '$project' },
      {
        $group: {
          _id: '$project._id',
          projectName: { $first: '$project.name' },
          postCount: { $sum: 1 },
          totalImpressions: { $sum: { $ifNull: ['$latestMetrics.impressions', 0] } },
          totalEngagement: {
            $sum: {
              $add: [
                { $ifNull: ['$latestMetrics.likes', 0] },
                { $ifNull: ['$latestMetrics.retweets', 0] },
                { $ifNull: ['$latestMetrics.replies', 0] },
                { $ifNull: ['$latestMetrics.quotes', 0] },
              ]
            }
          },
          totalLikes: { $sum: { $ifNull: ['$latestMetrics.likes', 0] } },
          totalRetweets: { $sum: { $ifNull: ['$latestMetrics.retweets', 0] } },
          totalReplies: { $sum: { $ifNull: ['$latestMetrics.replies', 0] } },
        },
      },
      {
        $project: {
          projectName: 1,
          postCount: 1,
          totalImpressions: 1,
          totalEngagement: 1,
          totalLikes: 1,
          totalRetweets: 1,
          totalReplies: 1,
          avgEngagementRate: {
            $cond: {
              if: { $gt: ['$totalImpressions', 0] },
              then: { $multiply: [{ $divide: ['$totalEngagement', '$totalImpressions'] }, 100] },
              else: 0
            }
          }
        },
      },
      { $sort: { totalEngagement: -1 } },
    ]);

    // ==================================================
    // 3. TOP PERFORMING POSTS
    // ==================================================
    const topPosts = await Post.aggregate([
      {
        $match: {
          organizationId: organization._id,
          status: 'approved',
          postedAt: { $gte: from, $lte: to },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'creatorId',
          foreignField: '_id',
          as: 'creator',
        },
      },
      { $unwind: '$creator' },
      {
        $project: {
          postUrl: 1,
          content: 1,
          postedAt: 1,
          creatorName: '$creator.name',
          creatorHandle: '$creator.creatorProfile.twitterHandle',
          impressions: '$latestMetrics.impressions',
          likes: '$latestMetrics.likes',
          retweets: '$latestMetrics.retweets',
          replies: '$latestMetrics.replies',
          totalEngagement: {
            $add: [
              '$latestMetrics.likes',
              '$latestMetrics.retweets',
              '$latestMetrics.replies',
            ],
          },
          engagementRate: '$latestMetrics.engagementRate',
        },
      },
      { $sort: { totalEngagement: -1 } },
      { $limit: 10 },
    ]);

    // ==================================================
    // 4. CREATOR LEADERBOARD (using latest metrics per post)
    // ==================================================
    const creatorLeaderboard = await Post.aggregate([
      {
        $match: {
          organizationId: organization._id,
          status: 'approved',
          postedAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: '$creatorId',
          postCount: { $sum: 1 },
          totalImpressions: { $sum: { $ifNull: ['$latestMetrics.impressions', 0] } },
          totalEngagement: {
            $sum: {
              $add: [
                { $ifNull: ['$latestMetrics.likes', 0] },
                { $ifNull: ['$latestMetrics.retweets', 0] },
                { $ifNull: ['$latestMetrics.replies', 0] },
                { $ifNull: ['$latestMetrics.quotes', 0] },
              ],
            },
          },
          totalLikes: { $sum: { $ifNull: ['$latestMetrics.likes', 0] } },
          totalRetweets: { $sum: { $ifNull: ['$latestMetrics.retweets', 0] } },
          totalReplies: { $sum: { $ifNull: ['$latestMetrics.replies', 0] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'creator',
        },
      },
      { $unwind: '$creator' },
      {
        $project: {
          creatorName: '$creator.name',
          creatorHandle: '$creator.creatorProfile.twitterHandle',
          creatorAvatar: '$creator.creatorProfile.twitterAvatar',
          postCount: 1,
          totalImpressions: 1,
          totalEngagement: 1,
          totalLikes: 1,
          totalRetweets: 1,
          totalReplies: 1,
          avgEngagementRate: {
            $cond: {
              if: { $gt: ['$totalImpressions', 0] },
              then: { $multiply: [{ $divide: ['$totalEngagement', '$totalImpressions'] }, 100] },
              else: 0
            }
          },
          avgImpressions: {
            $cond: {
              if: { $gt: ['$postCount', 0] },
              then: { $divide: ['$totalImpressions', '$postCount'] },
              else: 0
            }
          }
        },
      },
      { $sort: { totalEngagement: -1 } },
      { $limit: 15 },
    ]);

    // ==================================================
    // 5. ENGAGEMENT TYPE BREAKDOWN (for pie chart)
    // ==================================================
    const engagementBreakdown = await Post.aggregate([
      {
        $match: {
          organizationId: organization._id,
          status: 'approved',
          postedAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: { $ifNull: ['$latestMetrics.likes', 0] } },
          totalRetweets: { $sum: { $ifNull: ['$latestMetrics.retweets', 0] } },
          totalReplies: { $sum: { $ifNull: ['$latestMetrics.replies', 0] } },
          totalQuotes: { $sum: { $ifNull: ['$latestMetrics.quotes', 0] } },
          totalBookmarks: { $sum: { $ifNull: ['$latestMetrics.bookmarks', 0] } },
        },
      },
    ]);

    // ==================================================
    // 6. POSTING PATTERNS (Day of week & Hour of day)
    // ==================================================
    const postingPatterns = await Post.aggregate([
      {
        $match: {
          organizationId: organization._id,
          status: 'approved',
          postedAt: { $gte: from, $lte: to },
        },
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$postedAt' }, // 1=Sunday, 7=Saturday
          hourOfDay: { $hour: '$postedAt' },
          engagement: {
            $add: [
              '$latestMetrics.likes',
              '$latestMetrics.retweets',
              '$latestMetrics.replies',
            ],
          },
          impressions: '$latestMetrics.impressions',
        },
      },
      {
        $group: {
          _id: { day: '$dayOfWeek', hour: '$hourOfDay' },
          postCount: { $sum: 1 },
          avgEngagement: { $avg: '$engagement' },
          avgImpressions: { $avg: '$impressions' },
        },
      },
      { $sort: { '_id.day': 1, '_id.hour': 1 } },
    ]);

    // ==================================================
    // 7. PERFORMANCE INSIGHTS
    // ==================================================
    const overallStats = await Post.aggregate([
      {
        $match: {
          organizationId: organization._id,
          status: 'approved',
          postedAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: { $ifNull: ['$latestMetrics.impressions', 0] } },
          totalEngagement: {
            $sum: {
              $add: [
                { $ifNull: ['$latestMetrics.likes', 0] },
                { $ifNull: ['$latestMetrics.retweets', 0] },
                { $ifNull: ['$latestMetrics.replies', 0] },
                { $ifNull: ['$latestMetrics.quotes', 0] },
              ]
            }
          },
          totalPosts: { $sum: 1 },
          avgEngagementRate: {
            $avg: {
              $cond: {
                if: { $gt: [{ $ifNull: ['$latestMetrics.impressions', 0] }, 0] },
                then: {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $add: [
                            { $ifNull: ['$latestMetrics.likes', 0] },
                            { $ifNull: ['$latestMetrics.retweets', 0] },
                            { $ifNull: ['$latestMetrics.replies', 0] },
                            { $ifNull: ['$latestMetrics.quotes', 0] },
                          ]
                        },
                        { $ifNull: ['$latestMetrics.impressions', 1] }
                      ]
                    },
                    100
                  ]
                },
                else: 0
              }
            }
          }
        },
      },
      {
        $project: {
          totalImpressions: 1,
          totalEngagement: 1,
          totalPosts: 1,
          avgEngagementRate: 1,
          avgImpressionsPerPost: {
            $cond: {
              if: { $gt: ['$totalPosts', 0] },
              then: { $divide: ['$totalImpressions', '$totalPosts'] },
              else: 0
            }
          },
        },
      },
    ]);

    const responseData = {
      dateRange: { from, to },
      dailyMetrics: completeDailyMetrics,
      projectPerformance,
      topPosts,
      creatorLeaderboard,
      engagementBreakdown: engagementBreakdown[0] || {},
      postingPatterns,
      overallStats: overallStats[0] || {},
    };

    logger.info({ organizationId, from, to }, 'Detailed analytics fetched');

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600, max-age=120',
        },
      }
    );
  } catch (error) {
    logger.error({ error }, 'Error fetching detailed analytics');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

