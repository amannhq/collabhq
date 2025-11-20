import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { User, Post, Metrics } from '@/lib/db/models';
import type { IUser } from '@/lib/db/models/User';
import type { IPost } from '@/lib/db/models/Post';
import type { IMetrics } from '@/lib/db/models/Metrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, Heart, Repeat, MessageCircle, Eye, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { MetricsTimeline } from '@/components/posts/MetricsTimeline';

interface PostDetailPageProps {
  params: Promise<{
    creatorId: string;
    postId: string;
  }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  await connectDB();

  // Get creator
  const creator = await User.findById(resolvedParams.creatorId).select('role').lean() as unknown as IUser | null;

  if (!creator || creator.role !== 'creator') {
    redirect('/404');
  }

  // Security check
  if (session.user.id !== creator._id.toString()) {
    redirect('/unauthorized');
  }

  // Get post with metrics history
  const post = await Post.findById(resolvedParams.postId)
    .select('postUrl status latestMetrics growth createdAt verifiedAt rejectedAt adminNotes creatorId')
    .lean() as unknown as IPost | null;

  if (!post || post.creatorId?.toString() !== creator._id.toString()) {
    redirect('/404');
  }

  // Get metrics history
  const metricsHistoryRaw = await Metrics.find({ postId: post._id })
    .select('metrics growth recordedAt')
    .sort({ recordedAt: -1 })
    .limit(30)
    .lean() as unknown as IMetrics[];

  // Transform metrics history into timeline events for client component
  const timelineEvents = metricsHistoryRaw.map((metric) => {
    const totalEngagement = (metric.metrics.likes || 0) + (metric.metrics.retweets || 0) + (metric.metrics.replies || 0);
    return {
      type: 'metrics_updated' as const,
      date: metric.recordedAt.toISOString(),
      title: 'Metrics Updated',
      description: `${totalEngagement.toLocaleString()} total engagements • ${metric.metrics.impressions?.toLocaleString() || 0} impressions`,
      data: {
        metrics: metric.metrics,
        growth: metric.growth,
      },
    };
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatGrowth = (value: number | undefined) => {
    if (!value) return '0%';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value: number | undefined) => {
    if (!value || value === 0) return null;
    return value > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4 hover:bg-zinc-100">
          <Link href={`/creator/${resolvedParams.creatorId}/posts`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Post Details</h1>
              {getStatusBadge(post.status)}
            </div>
            <a
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-zinc-900 flex items-center gap-2 break-all"
            >
              {post.postUrl}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        </div>
      </div>

      {/* Status Info */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">Status Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-zinc-50">
              <p className="text-muted-foreground mb-1 text-xs">Submitted</p>
              <p className="font-medium text-zinc-900">
                {format(new Date(post.createdAt), 'PPP')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>

            {post.verifiedAt && (
              <div className="p-3 rounded-lg bg-green-50">
                <p className="text-muted-foreground mb-1 text-xs">Approved</p>
                <p className="font-medium text-zinc-900">
                  {format(new Date(post.verifiedAt), 'PPP')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(post.verifiedAt), { addSuffix: true })}
                </p>
              </div>
            )}
          </div>

          {post.status === 'rejected' && post.adminNotes && (
            <>
              <Separator className="bg-zinc-200" />
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-700 mb-1">Rejection Reason</p>
                <p className="text-xs text-red-600">{post.adminNotes}</p>
              </div>
            </>
          )}

          {post.status === 'pending' && (
            <>
              <Separator className="bg-zinc-200" />
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-700">Awaiting Review</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Your post is currently being reviewed by an admin. You&apos;ll be notified once it&apos;s approved.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Current Metrics */}
      {post.status === 'approved' && post.latestMetrics && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Current Metrics</CardTitle>
            <CardDescription className="text-xs">Latest performance data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Likes */}
              <div className="space-y-2 p-4 rounded-lg bg-zinc-50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Heart className="h-4 w-4 text-red-600" />
                  <span>Likes</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-zinc-900">
                    {post.latestMetrics.likes?.toLocaleString() || 0}
                  </p>
                  {post.growth?.likesDelta !== undefined && (
                    <div className="flex items-center gap-1 text-xs">
                      {getGrowthIcon(post.growth.likesDelta)}
                      <span className={post.growth.likesDelta > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {formatGrowth(post.growth.likesDelta)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Retweets */}
              <div className="space-y-2 p-4 rounded-lg bg-zinc-50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Repeat className="h-4 w-4 text-green-600" />
                  <span>Retweets</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-zinc-900">
                    {post.latestMetrics.retweets?.toLocaleString() || 0}
                  </p>
                  {post.growth?.retweetsDelta !== undefined && (
                    <div className="flex items-center gap-1 text-xs">
                      {getGrowthIcon(post.growth.retweetsDelta)}
                      <span className={post.growth.retweetsDelta > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {formatGrowth(post.growth.retweetsDelta)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Replies */}
              <div className="space-y-2 p-4 rounded-lg bg-zinc-50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <span>Replies</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-zinc-900">
                    {post.latestMetrics.replies?.toLocaleString() || 0}
                  </p>
                  {post.growth?.repliesDelta !== undefined && (
                    <div className="flex items-center gap-1 text-xs">
                      {getGrowthIcon(post.growth.repliesDelta)}
                      <span className={post.growth.repliesDelta > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {formatGrowth(post.growth.repliesDelta)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Impressions */}
              <div className="space-y-2 p-4 rounded-lg bg-zinc-50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Eye className="h-4 w-4 text-purple-600" />
                  <span>Impressions</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-zinc-900">
                    {post.latestMetrics.impressions?.toLocaleString() || 0}
                  </p>
                  {post.growth?.impressionsDelta !== undefined && (
                    <div className="flex items-center gap-1 text-xs">
                      {getGrowthIcon(post.growth.impressionsDelta)}
                      <span className={post.growth.impressionsDelta > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {formatGrowth(post.growth.impressionsDelta)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics History */}
      {post.status === 'approved' && timelineEvents.length > 0 && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Metrics History</CardTitle>
            <CardDescription className="text-xs">
              Track how your post performance has evolved over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricsTimeline events={timelineEvents} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
