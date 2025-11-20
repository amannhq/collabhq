import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { Post, User } from '@/lib/db/models';
import type { IUser } from '@/lib/db/models/User';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/analytics/StatsCard';
import { Heart, Repeat, MessageCircle } from 'lucide-react';

interface CreatorAnalyticsPageProps {
  params: Promise<{
    creatorId: string;
  }>;
  searchParams: Promise<{
    range?: string;
  }>;
}

export default async function CreatorAnalyticsPage({
  params,
  searchParams,
}: CreatorAnalyticsPageProps) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { creatorId } = resolvedParams;
  const { range = '30d' } = resolvedSearchParams;

  await connectDB();

  // Get creator
  const creator = await User.findById(creatorId)
    .select('role name email twitterHandle')
    .lean() as unknown as IUser | null;

  if (!creator || creator.role !== 'creator') {
    redirect('/404');
  }

  // Security check
  if (session.user.id !== creator._id.toString()) {
    redirect('/unauthorized');
  }

  // Calculate date range
  const now = new Date();
  let startDate: Date;

  switch (range) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startDate = new Date(0);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get all approved posts for this creator (filtered by date range)
  const approvedPosts = await Post.find({
    creatorId: creator._id,
    status: 'approved',
    ...(range !== 'all' && { createdAt: { $gte: startDate } }),
  })
    .select('_id postUrl latestMetrics growth createdAt approvedAt')
    .sort({ createdAt: -1 })
    .lean();

  // Calculate aggregate statistics
  const totalLikes = approvedPosts.reduce((sum, p) => sum + ((p as { latestMetrics?: { likes?: number } }).latestMetrics?.likes || 0), 0);
  const totalRetweets = approvedPosts.reduce((sum, p) => sum + ((p as { latestMetrics?: { retweets?: number } }).latestMetrics?.retweets || 0), 0);
  const totalReplies = approvedPosts.reduce((sum, p) => sum + ((p as { latestMetrics?: { replies?: number } }).latestMetrics?.replies || 0), 0);
  const totalImpressions = approvedPosts.reduce((sum, p) => sum + ((p as { latestMetrics?: { impressions?: number } }).latestMetrics?.impressions || 0), 0);
  const totalEngagement = totalLikes + totalRetweets + totalReplies;
  const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

  // Find top performing post
  const topPost = approvedPosts.length > 0 ? approvedPosts.reduce((max, p) => {
    const pTyped = p as { latestMetrics?: { likes?: number; retweets?: number; replies?: number } };
    const maxTyped = max as { latestMetrics?: { likes?: number; retweets?: number; replies?: number } };
    const engagement = (pTyped.latestMetrics?.likes || 0) + (pTyped.latestMetrics?.retweets || 0) + (pTyped.latestMetrics?.replies || 0);
    const maxEngagement = (maxTyped.latestMetrics?.likes || 0) + (maxTyped.latestMetrics?.retweets || 0) + (maxTyped.latestMetrics?.replies || 0);
    return engagement > maxEngagement ? p : max;
  }, approvedPosts[0]) : null;

  const topPostEngagement = topPost ? 
    ((topPost as { latestMetrics?: { likes?: number; retweets?: number; replies?: number } }).latestMetrics?.likes || 0) + 
    ((topPost as { latestMetrics?: { likes?: number; retweets?: number; replies?: number } }).latestMetrics?.retweets || 0) + 
    ((topPost as { latestMetrics?: { likes?: number; retweets?: number; replies?: number } }).latestMetrics?.replies || 0) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your content performance and growth
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/creator/${creatorId}/analytics?range=7d`}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${range === '7d' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'}`}
          >
            7 Days
          </a>
          <a
            href={`/creator/${creatorId}/analytics?range=30d`}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${range === '30d' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'}`}
          >
            30 Days
          </a>
          <a
            href={`/creator/${creatorId}/analytics?range=90d`}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${range === '90d' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'}`}
          >
            90 Days
          </a>
          <a
            href={`/creator/${creatorId}/analytics?range=all`}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${range === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'}`}
          >
            All Time
          </a>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Engagement"
          value={totalEngagement.toLocaleString()}
          iconType="trending-up"
          description={`${engagementRate.toFixed(2)}% engagement rate`}
        />
        <StatsCard
          title="Total Impressions"
          value={totalImpressions.toLocaleString()}
          iconType="eye"
          description={`Across ${approvedPosts.length} posts`}
        />
        <StatsCard
          title="Avg Likes per Post"
          value={Math.round(totalLikes / (approvedPosts.length || 1)).toLocaleString()}
          iconType="heart"
          description="Average performance"
        />
        <StatsCard
          title="Top Post"
          value={topPostEngagement.toLocaleString()}
          iconType="award"
          description="Best performing post"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList className="bg-zinc-100">
          <TabsTrigger value="engagement" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Engagement</TabsTrigger>
          <TabsTrigger value="growth" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Growth</TabsTrigger>
          <TabsTrigger value="breakdown" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Breakdown</TabsTrigger>
        </TabsList>

        {/* Engagement Chart */}
        <TabsContent value="engagement" className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Engagement Over Time</CardTitle>
              <CardDescription className="text-xs">
                Track likes, retweets, and replies across all posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* <EngagementChart data={chartData} /> */}
              <p className="text-sm text-muted-foreground">Chart visualization coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Chart */}
        <TabsContent value="growth" className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Growth Trends</CardTitle>
              <CardDescription className="text-xs">
                Monitor how your metrics are growing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* <GrowthChart data={chartData} /> */}
              <p className="text-sm text-muted-foreground">Chart visualization coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Engagement Breakdown */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Engagement Breakdown</CardTitle>
                <CardDescription className="text-xs">Distribution of engagement types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-zinc-900">Likes</span>
                    </div>
                    <span className="font-medium text-zinc-900">{totalLikes.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600"
                      style={{ width: `${(totalLikes / totalEngagement) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-green-600" />
                      <span className="text-zinc-900">Retweets</span>
                    </div>
                    <span className="font-medium text-zinc-900">{totalRetweets.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{ width: `${(totalRetweets / totalEngagement) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-zinc-900">Replies</span>
                    </div>
                    <span className="font-medium text-zinc-900">{totalReplies.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${(totalReplies / totalEngagement) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
                <CardDescription className="text-xs">Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
                  <span className="text-sm text-muted-foreground">Engagement Rate</span>
                  <span className="text-2xl font-bold text-zinc-900">{engagementRate.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
                  <span className="text-sm text-muted-foreground">Avg Engagement/Post</span>
                  <span className="text-2xl font-bold text-zinc-900">
                    {Math.round(totalEngagement / (approvedPosts.length || 1)).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
                  <span className="text-sm text-muted-foreground">Avg Impressions/Post</span>
                  <span className="text-2xl font-bold text-zinc-900">
                    {Math.round(totalImpressions / (approvedPosts.length || 1)).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
                  <span className="text-sm text-muted-foreground">Total Posts</span>
                  <span className="text-2xl font-bold text-zinc-900">{approvedPosts.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Top Posts */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Posts</CardTitle>
          <CardDescription className="text-xs">Your best content in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {approvedPosts
              .sort((a, b) => {
                const aTyped = a as { latestMetrics?: { likes?: number; retweets?: number; replies?: number } };
                const bTyped = b as { latestMetrics?: { likes?: number; retweets?: number; replies?: number } };
                const aEng = (aTyped.latestMetrics?.likes || 0) + (aTyped.latestMetrics?.retweets || 0) + (aTyped.latestMetrics?.replies || 0);
                const bEng = (bTyped.latestMetrics?.likes || 0) + (bTyped.latestMetrics?.retweets || 0) + (bTyped.latestMetrics?.replies || 0);
                return bEng - aEng;
              })
              .slice(0, 5)
              .map((post, index) => {
                const postTyped = post as {
                  _id?: { toString(): string };
                  postUrl?: string;
                  latestMetrics?: {
                    likes?: number;
                    retweets?: number;
                    replies?: number;
                  };
                };
                const engagement = (postTyped.latestMetrics?.likes || 0) + (postTyped.latestMetrics?.retweets || 0) + (postTyped.latestMetrics?.replies || 0);
                return (
                  <div key={String(postTyped._id?.toString())} className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1 text-zinc-900">{postTyped.postUrl || 'Post'}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-600" />
                            <span className="font-medium text-zinc-900">{postTyped.latestMetrics?.likes?.toLocaleString() || 0}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-zinc-900">{postTyped.latestMetrics?.retweets?.toLocaleString() || 0}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3 text-blue-600" />
                            <span className="font-medium text-zinc-900">{postTyped.latestMetrics?.replies?.toLocaleString() || 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-lg font-bold text-zinc-900">{engagement.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Engagement</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
