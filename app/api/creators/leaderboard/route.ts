import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User, Post } from '@/lib/db/models';
import { withErrorHandler, NotFoundError } from '@/lib/api/error-handler';
import { withAuth } from '@/lib/api/auth-middleware';
import { createLogger } from '@/lib/utils/logger';
import { Types } from 'mongoose';

const logger = createLogger('leaderboard-api');

export const GET = withErrorHandler(withAuth(async (request: NextRequest, { user }) => {
  const startedAt = Date.now();
  await connectDB();

  // Get the logged-in creator's organization
  const loggedInUser = await User.findById(user.id)
    .select('organizationId')
    .lean() as { _id: Types.ObjectId; organizationId?: Types.ObjectId } | null;

  if (!loggedInUser?.organizationId) {
    throw NotFoundError('Organization');
  }

  const orgId = loggedInUser.organizationId;

  // OPTIMIZED: Use single aggregation pipeline instead of multiple queries per creator
  const leaderboardData = await Post.aggregate([
    // Match posts from the organization
    {
      $match: {
        organizationId: new Types.ObjectId(orgId.toString()),
      },
    },
    // Group by creator and calculate stats
    {
      $group: {
        _id: '$creatorId',
        totalPosts: { $sum: 1 },
        approvedPosts: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
        },
        totalLikes: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'approved'] },
              { $ifNull: ['$latestMetrics.likes', 0] },
              0,
            ],
          },
        },
        totalRetweets: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'approved'] },
              { $ifNull: ['$latestMetrics.retweets', 0] },
              0,
            ],
          },
        },
        totalReplies: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'approved'] },
              { $ifNull: ['$latestMetrics.replies', 0] },
              0,
            ],
          },
        },
        totalImpressions: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'approved'] },
              { $ifNull: ['$latestMetrics.impressions', 0] },
              0,
            ],
          },
        },
      },
    },
    // Calculate derived metrics
    {
      $addFields: {
        totalEngagement: {
          $add: ['$totalLikes', '$totalRetweets', '$totalReplies'],
        },
        avgEngagementRate: {
          $cond: [
            { $gt: ['$totalImpressions', 0] },
            {
              $multiply: [
                {
                  $divide: [
                    { $add: ['$totalLikes', '$totalRetweets', '$totalReplies'] },
                    '$totalImpressions',
                  ],
                },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
    // Lookup creator details
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'creator',
      },
    },
    {
      $unwind: '$creator',
    },
    // Project final fields
    {
      $project: {
        creatorId: '$_id',
        creatorName: '$creator.name',
        creatorHandle: '$creator.creatorProfile.twitterHandle',
        creatorAvatar: '$creator.avatar',
        postCount: '$totalPosts',
        approvedPosts: '$approvedPosts',
        totalEngagement: 1,
        totalImpressions: 1,
        avgEngagementRate: 1,
      },
    },
    // Sort by total engagement
    {
      $sort: { totalEngagement: -1 },
    },
    // Limit to top 10
    {
      $limit: 10,
    },
  ]);

  // Add ranks
  const sortedLeaderboard = leaderboardData.map((entry, index) => ({
    ...entry,
    creatorId: entry.creatorId.toString(),
    rank: index + 1,
  }));

  logger.info(
    {
      organizationId: orgId.toString(),
      creatorsCount: sortedLeaderboard.length,
      duration: Date.now() - startedAt,
    },
    'Leaderboard fetched'
  );

  return NextResponse.json({
    success: true,
    data: sortedLeaderboard,
  });
}));
