import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { User, Post, Metrics } from '@/lib/db/models';
import type { IUser } from '@/lib/db/models/User';
import type { IPost } from '@/lib/db/models/Post';
import type { IMetrics } from '@/lib/db/models/Metrics';
import { CreatorOverview } from '@/components/creator/CreatorOverview';
import { CreatorStats } from '@/components/creator/CreatorStats';
import { RecentActivity } from '@/components/creator/RecentActivity';
import { CreatorDashboardWrapper } from '@/components/creator/CreatorDashboardWrapper';
import { CreatorLeaderboard } from '@/components/creator/CreatorLeaderboard';
import { EngagementChart30Days } from '@/components/creator/EngagementChart30Days';

interface CreatorDashboardPageProps {
  params: Promise<{
    creatorId: string;
  }>;
}

export default async function CreatorDashboardPage({
  params,
}: CreatorDashboardPageProps) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  await connectDB();

  // Get creator
  const creator = await User.findById(resolvedParams.creatorId)
    .populate('organizationId', 'name slug')
    .select('role name email avatar creatorProfile organizationId requirePasswordChange')
    .lean() as unknown as IUser | null;

  if (!creator || creator.role !== 'creator') {
    redirect('/404');
  }

  // Security check
  if (session.user.id !== creator._id.toString()) {
    redirect('/unauthorized');
  }

  // Get recent posts
  const posts = await Post.find({ creatorId: creator._id })
    .select('postUrl status latestMetrics createdAt')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean() as unknown as IPost[];

  // Get overall stats
  const [totalPosts, approvedPosts, pendingPosts, rejectedPosts] = await Promise.all([
    Post.countDocuments({ creatorId: creator._id }),
    Post.countDocuments({ creatorId: creator._id, status: 'approved' }),
    Post.countDocuments({ creatorId: creator._id, status: 'pending' }),
    Post.countDocuments({ creatorId: creator._id, status: 'rejected' }),
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

    // Get recent metrics updates
  const recentMetrics = await Metrics.find({ creatorId: creator._id })
    .select('postId metrics recordedAt')
    .sort({ recordedAt: -1 })
    .limit(10)
    .lean() as unknown as IMetrics[];

  const stats = {
    totalPosts,
    approvedPosts,
    pendingPosts,
    rejectedPosts,
    totalEngagement,
    totalImpressions: engagement.totalImpressions,
    avgEngagementRate:
      engagement.totalImpressions > 0
        ? ((totalEngagement / engagement.totalImpressions) * 100).toFixed(2)
        : '0',
  };

  const formattedPosts = posts.map((post) => ({
    _id: post._id.toString(),
    postUrl: post.postUrl,
    status: post.status,
    latestMetrics: post.latestMetrics
      ? {
          likes: post.latestMetrics.likes || 0,
          retweets: post.latestMetrics.retweets || 0,
          replies: post.latestMetrics.replies || 0,
          quotes: post.latestMetrics.quotes || 0,
          impressions: post.latestMetrics.impressions || 0,
          engagementRate: post.latestMetrics.engagementRate || 0,
          bookmarks: post.latestMetrics.bookmarks,
          views: post.latestMetrics.views,
          lastUpdatedAt: post.latestMetrics.lastUpdatedAt?.toISOString() || new Date().toISOString(),
          updatedBy: post.latestMetrics.updatedBy?.toString(),
        }
      : undefined,
    createdAt: post.createdAt.toISOString(),
  }));

  const recentActivity = recentMetrics.map((metric) => ({
    _id: metric._id.toString(),
    type: 'metrics_updated' as const,
    description: 'Updated post metrics',
    timestamp: metric.recordedAt.toISOString(),
    metadata: {
      postUrl: (metric.postId as { postUrl?: string })?.postUrl,
      metrics: metric.metrics,
    },
  }));

  // Get leaderboard data (top creators based on overall engagement and impressions)
  const allCreators = await User.find({
    organizationId: creator.organizationId,
    role: 'creator',
  })
    .select('_id name email avatar creatorProfile')
    .lean() as unknown as IUser[];

  // Get stats for each creator in the leaderboard
  const leaderboardData = await Promise.all(
    allCreators.map(async (c) => {
      const totalPosts = await Post.countDocuments({ creatorId: c._id, status: 'approved' });

      // Calculate overall engagement with weighted scoring
      const engagementResult = await Post.aggregate([
        {
          $match: {
            creatorId: c._id,
            status: 'approved',
          }
        },
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

      // Calculate Creator Impact Score
      // Combines engagement quality with reach (impressions)
      const engagementRate =
        engagement.totalImpressions > 0
          ? (totalEngagement / engagement.totalImpressions) * 100
          : 0;

      // Impact Score Formula: Balances engagement quality with reach
      const impactScore =
        (totalEngagement * 0.5) +           // Raw engagement (50% weight)
        (engagement.totalImpressions * 0.0001) +  // Impressions (normalized, 10% weight)
        (engagementRate * totalPosts * 0.5);      // Engagement rate * consistency (40% weight)

      return {
        creatorId: c._id.toString(),
        creatorName: c.name,
        creatorHandle: c.creatorProfile?.twitterHandle,
        creatorAvatar: c.avatar,
        postCount: totalPosts,
        totalEngagement,
        totalImpressions: engagement.totalImpressions,
        engagementRate,
        impactScore, // Used for ranking
      };
    })
  );

  // Sort by impact score and add rank (top 10 creators)
  const sortedLeaderboard = leaderboardData
    .filter(entry => entry.postCount > 0) // Only creators with posts
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 10) // Top 10 creators
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  // Get 30-day engagement data for current creator
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const creatorPosts = await Post.find({
    creatorId: creator._id,
    status: 'approved',
    createdAt: { $gte: thirtyDaysAgo }
  })
    .select('createdAt latestMetrics')
    .sort({ createdAt: 1 })
    .lean() as unknown as IPost[];

  // Group engagement by day
  const engagementByDay = new Map<string, number>();

  creatorPosts.forEach((post) => {
    const dateKey = post.createdAt.toISOString().split('T')[0];
    const postEngagement =
      (post.latestMetrics?.likes || 0) +
      (post.latestMetrics?.retweets || 0) +
      (post.latestMetrics?.replies || 0);

    engagementByDay.set(
      dateKey,
      (engagementByDay.get(dateKey) || 0) + postEngagement
    );
  });

  // Create array with all 30 days (including days with 0 engagement)
  const engagementData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];

    engagementData.push({
      date: dateKey,
      engagement: engagementByDay.get(dateKey) || 0,
    });
  }

  const totalEngagement30Days = Array.from(engagementByDay.values()).reduce((sum, val) => sum + val, 0);
  const averageEngagement30Days = engagementData.length > 0 ? totalEngagement30Days / 30 : 0;

  return (
    <CreatorDashboardWrapper requirePasswordChange={creator.requirePasswordChange || false}>
      <div className="space-y-6 p-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">
            Welcome back, <span className="font-normal">{creator.name}!</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s an overview of your content performance
          </p>
        </div>

        {/* Leaderboard & Engagement Chart Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Leaderboard - Left */}
          <CreatorLeaderboard
            data={sortedLeaderboard}
            currentCreatorId={resolvedParams.creatorId}
          />

          {/* 30-Day Engagement Chart - Right */}
          <EngagementChart30Days
            data={engagementData}
            totalEngagement={totalEngagement30Days}
            averageEngagement={averageEngagement30Days}
          />
        </div>

        {/* Stats Cards */}
        <CreatorStats stats={stats} />

        {/* Overview Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Posts */}
          <CreatorOverview
            recentPosts={formattedPosts}
            creatorId={resolvedParams.creatorId}
          />

          {/* Recent Activity */}
          <RecentActivity activities={recentActivity} />
        </div>
      </div>
    </CreatorDashboardWrapper>
  );
}
