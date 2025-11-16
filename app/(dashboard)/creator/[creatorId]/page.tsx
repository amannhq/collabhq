import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { User, Post, Project, Metrics } from '@/lib/db/models';
import type { IUser } from '@/lib/db/models/User';
import type { IProject } from '@/lib/db/models/Project';
import type { IPost } from '@/lib/db/models/Post';
import type { IMetrics } from '@/lib/db/models/Metrics';
import { CreatorOverview } from '@/components/creator/CreatorOverview';
import { CreatorStats } from '@/components/creator/CreatorStats';
import { RecentActivity } from '@/components/creator/RecentActivity';

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
    .select('role name email avatar creatorProfile organizationId')
    .lean() as unknown as IUser | null;

  if (!creator || creator.role !== 'creator') {
    redirect('/404');
  }

  // Security check
  if (session.user.id !== creator._id.toString()) {
    redirect('/unauthorized');
  }

  // Get project
  const project = creator.creatorProfile?.projectId
    ? await Project.findById(creator.creatorProfile.projectId)
        .select('name description')
        .lean() as unknown as IProject | null
    : null;

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

  const creatorData = {
    _id: creator._id.toString(),
    name: creator.name || '',
    email: creator.email || '',
    avatar: creator.avatar,
    twitterHandle: creator.creatorProfile?.twitterHandle,
    status: creator.creatorProfile?.status,
    organization: creator.organizationId
      ? {
          _id: String((creator.organizationId as { _id?: { toString(): string } })._id?.toString()),
          name: (creator.organizationId as { name?: string }).name || '',
          slug: (creator.organizationId as { slug?: string }).slug || '',
        }
      : undefined,
    project: project
      ? {
          _id: project._id.toString(),
          name: project.name,
          description: project.description,
        }
      : undefined,
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {creator.name}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Here&apos;s an overview of your content performance
        </p>
      </div>

      {/* Stats Cards */}
      <CreatorStats stats={stats} />

      {/* Overview Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Posts */}
                <CreatorOverview
          creator={creatorData}
          recentPosts={formattedPosts}
          creatorId={resolvedParams.creatorId}
        />

        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />
      </div>
    </div>
  );
}
