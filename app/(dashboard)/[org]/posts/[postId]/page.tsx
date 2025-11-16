import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ExternalLink,
  ArrowLeft,
  ThumbsUp,
  Repeat2,
  MessageCircle,
  Eye,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MetricsChart } from '@/components/analytics/MetricsChart';
import { MetricsHistory } from '@/components/posts/MetricsHistory';
import { MetricsTimeline } from '@/components/posts/MetricsTimeline';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import { Post, Metrics, Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';

interface PostDetailPageProps {
  params: {
    org: string;
    postId: string;
  };
}

type PostDetail = {
  projectId: { organizationId: { toString(): string }; name?: string };
  creatorId: { name?: string; email?: string; twitterHandle?: string };
  postUrl?: string;
  status?: string;
  createdAt?: Date;
  approvedAt?: Date;
  caption?: string;
  latestMetrics?: { likes?: number; retweets?: number; replies?: number; impressions?: number };
};

type MetricsRecord = {
  _id: { toString(): string };
  recordedAt: Date;
  metrics: { likes?: number; retweets?: number; replies?: number; impressions?: number };
};

async function getPostData(postId: string, organizationId: string) {
  await connectDB();

  const post = await Post.findById(postId)
    .populate('creatorId', 'name email twitterHandle')
    .populate('projectId', 'name organizationId')
    .lean() as unknown as PostDetail | null;

  if (!post) {
    return null;
  }

  // Verify post belongs to this organization
  if (post.projectId.organizationId.toString() !== organizationId) {
    return null;
  }

  // Get metrics history
  const metricsHistory = await Metrics.find({ postId })
    .sort({ recordedAt: 1 })
    .lean() as unknown as MetricsRecord[];

  return {
    post,
    metricsHistory,
  };
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  await connectDB();
  const organization = await Organization.findOne({
    slug: resolvedParams.org,
  }).lean<IOrganization>();

  if (!organization) {
    redirect('/');
  }

  const data = await getPostData(resolvedParams.postId, organization._id.toString());

  if (!data) {
    notFound();
  }

  const { post, metricsHistory } = data;

  const statusConfig: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
    pending: { label: 'Pending', variant: 'secondary' as const },
    approved: { label: 'Approved', variant: 'default' as const },
    rejected: { label: 'Rejected', variant: 'destructive' as const },
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    return new Intl.NumberFormat().format(num);
  };

  // Prepare chart data
  const chartData = (metricsHistory as MetricsRecord[]).map((m) => ({
    date: format(new Date(m.recordedAt), 'MMM dd'),
    value: (m.metrics.likes || 0) + (m.metrics.retweets || 0) + (m.metrics.replies || 0),
    likes: m.metrics.likes || 0,
    retweets: m.metrics.retweets || 0,
    replies: m.metrics.replies || 0,
    impressions: m.metrics.impressions || 0,
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${resolvedParams.org}/posts`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Post Details</h1>
          <p className="text-muted-foreground">View performance and metrics</p>
        </div>
        <Button variant="outline" asChild>
          <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Twitter
          </a>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Post Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Post Information</CardTitle>
                  <CardDescription>
                    Posted on {format(new Date(post.createdAt || new Date()), 'MMMM dd, yyyy')}
                  </CardDescription>
                </div>
                <Badge variant={statusConfig[post.status || 'pending'].variant}>
                  {statusConfig[post.status || 'pending'].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {post.caption && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Caption</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {post.caption}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Project</span>
                  <p className="font-medium">{post.projectId.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">URL</span>
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View Post <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest Metrics */}
          {post.latestMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Current Performance</CardTitle>
                <CardDescription>Latest metrics snapshot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm">Likes</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatNumber(post.latestMetrics.likes)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Repeat2 className="h-4 w-4" />
                      <span className="text-sm">Retweets</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatNumber(post.latestMetrics.retweets)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">Replies</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatNumber(post.latestMetrics.replies)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">Impressions</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatNumber(post.latestMetrics.impressions)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metrics Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metrics Over Time</CardTitle>
                <CardDescription>Track engagement growth</CardDescription>
              </CardHeader>
              <CardContent>
                <MetricsChart
                  data={chartData}
                  dataKey="likes"
                  title="Likes"
                  color="hsl(var(--chart-1))"
                />
              </CardContent>
            </Card>
          )}

          {/* Metrics History Table */}
          <MetricsHistory metrics={metricsHistory.map((m) => ({
            _id: m._id.toString(),
            metrics: {
              likes: m.metrics.likes || 0,
              retweets: m.metrics.retweets || 0,
              replies: m.metrics.replies || 0,
              impressions: m.metrics.impressions || 0,
            },
            recordedAt: m.recordedAt,
          }))} />

          {/* Activity Timeline */}
          <MetricsTimeline
            events={[
              {
                type: 'created',
                date: post.createdAt || new Date(),
                title: 'Post Submitted',
                description: `Submitted by ${post.creatorId.name}`,
              },
              ...(post.approvedAt
                ? [
                    {
                      type: 'approved' as const,
                      date: post.approvedAt,
                      title: 'Post Approved',
                      description: 'Post was approved by admin',
                    },
                  ]
                : []),
              ...(metricsHistory as MetricsRecord[]).slice(0, 5).map((m) => ({
                type: 'metrics_updated' as const,
                date: m.recordedAt,
                title: 'Metrics Updated',
                data: m.metrics,
              })),
            ]}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle>Creator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getInitials(post.creatorId.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{post.creatorId.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {post.creatorId.email}
                  </p>
                  {post.creatorId.twitterHandle && (
                    <p className="text-sm text-blue-600">
                      @{post.creatorId.twitterHandle}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(post.createdAt || new Date()), 'PPp')}
                  </p>
                </div>
              </div>
              {post.approvedAt && (
                <div className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Approved</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(post.approvedAt), 'PPp')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
