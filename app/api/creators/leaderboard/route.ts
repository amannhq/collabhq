import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { User, Post } from '@/lib/db/models';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get the logged-in creator's organization
    const loggedInUser = await User.findById(session.user.id)
      .select('organizationId')
      .lean() as { organizationId?: { toString(): string } } | null;

    if (!loggedInUser?.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get all creators from the same organization
    const creators = await User.find({
      organizationId: loggedInUser.organizationId,
      role: 'creator',
    })
      .select('_id name email avatar creatorProfile')
      .lean() as unknown as Array<{
        _id: { toString(): string };
        name: string;
        email: string;
        avatar?: string;
        creatorProfile?: {
          twitterHandle?: string;
        };
      }>;

    // Get stats for each creator
    const leaderboardData = await Promise.all(
      creators.map(async (creator) => {
        const [totalPosts, approvedPosts] = await Promise.all([
          Post.countDocuments({ creatorId: creator._id }),
          Post.countDocuments({ creatorId: creator._id, status: 'approved' }),
        ]);

        // Calculate total engagement
        const engagementResult = await Post.aggregate([
          { $match: { creatorId: creator._id, status: 'approved' } },
          {
            $group: {
              _id: null,
              totalLikes: { $sum: { $ifNull: ['$latestMetrics.likes', 0] } },
              totalRetweets: { $sum: { $ifNull: ['$latestMetrics.retweets', 0] } },
              totalReplies: { $sum: { $ifNull: ['$latestMetrics.replies', 0] } },
              totalImpressions: { $sum: { $ifNull: ['$latestMetrics.impressions', 0] } },
            },
          },
        ]);

        const engagement = engagementResult[0] || {
          totalLikes: 0,
          totalRetweets: 0,
          totalReplies: 0,
          totalImpressions: 0,
        };

        const totalEngagement = engagement.totalLikes + engagement.totalRetweets + engagement.totalReplies;
        const avgEngagementRate =
          engagement.totalImpressions > 0
            ? (totalEngagement / engagement.totalImpressions) * 100
            : 0;

        return {
          creatorId: creator._id.toString(),
          creatorName: creator.name,
          creatorHandle: creator.creatorProfile?.twitterHandle,
          creatorAvatar: creator.avatar,
          postCount: totalPosts,
          approvedPosts,
          totalEngagement,
          totalImpressions: engagement.totalImpressions,
          avgEngagementRate,
        };
      })
    );

    // Sort by total engagement (descending)
    const sortedLeaderboard = leaderboardData
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))
      .slice(0, 10); // Top 10 creators

    return NextResponse.json({
      success: true,
      data: sortedLeaderboard,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
