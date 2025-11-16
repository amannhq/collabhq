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
  const metricsHistory = await Metrics.find({ postId: post._id })
    .select('metrics growth recordedAt')
    .sort({ recordedAt: -1 })
    .limit(30)
    .lean() as unknown as IMetrics[];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href={`/creator/${resolvedParams.creatorId}/posts`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Post Details</h1>
              {getStatusBadge(post.status)}
            </div>
            <a
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              {post.postUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          
          {post.status === 'approved' && (
            <Button asChild>
              <Link href={`/creator/${resolvedParams.creatorId}/posts/${resolvedParams.postId}/update`}>
                Update Metrics
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Status Info */}
      <Card>
        <CardHeader>
          <CardTitle>Status Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Submitted</p>
              <p className="font-medium">
                {format(new Date(post.createdAt), 'PPP')}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
            
            {post.verifiedAt && (
              <div>
                <p className="text-muted-foreground mb-1">Approved</p>
                <p className="font-medium">
                  {format(new Date(post.verifiedAt), 'PPP')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.verifiedAt), { addSuffix: true })}
                </p>
              </div>
            )}
          </div>
          
          {post.status === 'rejected' && post.adminNotes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-red-500 mb-2">Rejection Reason</p>
                <p className="text-sm text-muted-foreground">{post.adminNotes}</p>
              </div>
            </>
          )}
          
          {post.status === 'pending' && (
            <>
              <Separator />
              <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">Awaiting Review</p>
                  <p className="text-xs text-muted-foreground mt-1">
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
        <Card>
          <CardHeader>
            <CardTitle>Current Metrics</CardTitle>
            <CardDescription>Latest performance data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Likes */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>Likes</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">
                    {post.latestMetrics.likes?.toLocaleString() || 0}
                  </p>
                  {post.growth?.likesDelta !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      {getGrowthIcon(post.growth.likesDelta)}
                      <span className={post.growth.likesDelta > 0 ? 'text-green-500' : 'text-red-500'}>
                        {formatGrowth(post.growth.likesDelta)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Retweets */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Repeat className="h-4 w-4 text-green-500" />
                  <span>Retweets</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">
                    {post.latestMetrics.retweets?.toLocaleString() || 0}
                  </p>
                  {post.growth?.retweetsDelta !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      {getGrowthIcon(post.growth.retweetsDelta)}
                      <span className={post.growth.retweetsDelta > 0 ? 'text-green-500' : 'text-red-500'}>
                        {formatGrowth(post.growth.retweetsDelta)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Replies */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span>Replies</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">
                    {post.latestMetrics.replies?.toLocaleString() || 0}
                  </p>
                  {post.growth?.repliesDelta !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      {getGrowthIcon(post.growth.repliesDelta)}
                      <span className={post.growth.repliesDelta > 0 ? 'text-green-500' : 'text-red-500'}>
                        {formatGrowth(post.growth.repliesDelta)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Impressions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 text-purple-500" />
                  <span>Impressions</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">
                    {post.latestMetrics.impressions?.toLocaleString() || 0}
                  </p>
                  {post.growth?.impressionsDelta !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      {getGrowthIcon(post.growth.impressionsDelta)}
                      <span className={post.growth.impressionsDelta > 0 ? 'text-green-500' : 'text-red-500'}>
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
      {post.status === 'approved' && metricsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Metrics History</CardTitle>
            <CardDescription>
              Track how your post performance has evolved over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricsTimeline events={metricsHistory as unknown as Parameters<typeof MetricsTimeline>[0]['events']} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
