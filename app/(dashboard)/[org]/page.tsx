import { redirect } from 'next/navigation';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { Organization, Project, Post, User } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { MetricsChart } from '@/components/analytics/MetricsChart';
import { EngagementChart } from '@/components/analytics/EngagementChart';
import { GrowthChart } from '@/components/analytics/GrowthChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  FileText,
  FolderKanban,
  TrendingUp,
  Plus,
  UserPlus,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('org-dashboard');

interface PageProps {
  params: {
    org: string;
  };
}

async function getOrganizationData(orgSlug: string, userId: string) {
  await connectDB();

  // Get organization
  const organization = await Organization.findOne({ slug: orgSlug }).lean<IOrganization>();
  
  if (!organization) {
    logger.warn({ orgSlug, userId }, 'Organization not found');
    return null;
  }

  const orgId = organization._id;

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
      'creatorProfile.status': 'active' 
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

  // Calculate engagement metrics
  const posts = await Post.find({ 
    organizationId: orgId,
    status: 'approved' 
  })
    .select('latestMetrics createdAt')
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

  const recentPostsData = await Post.aggregate([
    {
      $match: {
        organizationId: orgId,
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

  logger.info({ 
    orgId: orgId.toString(), 
    totalProjects, 
    totalCreators, 
    totalPosts 
  }, 'Fetched organization dashboard data');

  return {
    organization,
    stats: {
      totalProjects,
      activeProjects,
      totalCreators,
      activeCreators,
      totalPosts,
      approvedPosts,
      pendingPosts,
      totalEngagement,
      totalImpressions,
    },
    recentPosts,
    chartData: recentPostsData,
  };
}

export default async function OrganizationDashboard({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await requireAuth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const data = await getOrganizationData(resolvedParams.org, session.user.id);

  if (!data) {
    // Organization not found - check if user has another organization
    const connectDB = (await import('@/lib/db/mongodb')).default;
    const { User, Organization } = await import('@/lib/db/models');
    
    await connectDB();
    const user = await User.findById(session.user.id).select('organizationId').lean() as { organizationId?: mongoose.Types.ObjectId } | null;
    
    if (user?.organizationId) {
      const org = await Organization.findById(user.organizationId).select('slug').lean() as { slug?: string } | null;
      if (org?.slug && org.slug !== resolvedParams.org) {
        // Redirect to user's actual organization
        redirect(`/${org.slug}`);
      }
    }
    
    // No organization found at all - redirect to signup
    logger.error({ userId: session.user.id, attemptedSlug: resolvedParams.org }, 'User has no organization');
    redirect('/signup?error=no-organization');
  }

  const { organization, stats, recentPosts, chartData } = data;

  // Transform chart data
  const metricsData = chartData.map((item: { _id: string | Date; impressions?: number }) => ({
    date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.impressions || 0,
  }));

  const engagementData = chartData.map((item: { _id: string | Date; likes?: number; retweets?: number; replies?: number }) => ({
    name: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    likes: item.likes || 0,
    retweets: item.retweets || 0,
    replies: item.replies || 0,
  }));

  const growthData = chartData.map((item: { _id: string | Date; count?: number }) => ({
    date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    current: item.count || 0,
  }));

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with {organization.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${resolvedParams.org}/creators/invite`}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Creator
            </Button>
          </Link>
          <Link href={`/${resolvedParams.org}/projects/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeProjects} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreators}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeCreators} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.approvedPosts} approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Likes + Retweets + Replies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <MetricsChart
                title="Impressions Over Time"
                description="Total impressions for the last 7 days"
                data={metricsData}
                dataKey="value"
              />
            </div>
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Posts</CardTitle>
                  <CardDescription>
                    Latest posts from your creators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No posts yet</p>
                  ) : (
                    (recentPosts as Array<{ _id: { toString(): string }; creatorId?: { name?: string }; projectId?: { name?: string }; postUrl?: string; status?: string; createdAt?: Date }>).map((post) => (
                      <div
                        key={post._id.toString()}
                        className="flex items-center justify-between space-x-4"
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {post.creatorId?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {post.projectId?.name || 'No project'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {post.status === 'pending' && (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          {post.status === 'approved' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.createdAt || new Date()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <EngagementChart
            title="Engagement Breakdown"
            description="Likes, retweets, and replies over the last 7 days"
            data={engagementData}
          />
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <GrowthChart
            title="Post Growth"
            description="Number of posts published over the last 7 days"
            data={growthData}
          />
        </TabsContent>
      </Tabs>

      {/* Pending Approvals */}
      {stats.pendingPosts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              {stats.pendingPosts} post{stats.pendingPosts !== 1 ? 's' : ''} waiting for your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${params.org}/posts/pending`}>
              <Button variant="outline" className="w-full">
                Review Pending Posts
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
