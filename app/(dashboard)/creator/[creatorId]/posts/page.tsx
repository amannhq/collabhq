import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { User, Post } from '@/lib/db/models';
import type { IUser } from '@/lib/db/models/User';
import type { IPost } from '@/lib/db/models/Post';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ExternalLink, Heart, Repeat, MessageCircle, Eye, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CreatorPostsPageProps {
  params: Promise<{
    creatorId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function CreatorPostsPage({
  params,
  searchParams,
}: CreatorPostsPageProps) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
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

  // Build query
  const query: { creatorId: unknown; status?: string } = { creatorId: creator._id };
  if (resolvedSearchParams.status && resolvedSearchParams.status !== 'all') {
    query.status = resolvedSearchParams.status;
  }

  // Get posts
  const posts = await Post.find(query)
    .select('postUrl status latestMetrics createdAt approvedAt rejectedAt adminNotes')
    .sort({ createdAt: -1 })
    .lean() as unknown as IPost[];

  const statusFilter = resolvedSearchParams.status || 'all';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Posts</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all your submitted posts
          </p>
        </div>
        <Button asChild>
          <Link href={`/creator/${resolvedParams.creatorId}/posts/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Submit New Post
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          asChild
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
        >
          <Link href={`/creator/${resolvedParams.creatorId}/posts`}>All Posts</Link>
        </Button>
        <Button
          asChild
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          size="sm"
        >
          <Link href={`/creator/${resolvedParams.creatorId}/posts?status=approved`}>
            Approved
          </Link>
        </Button>
        <Button
          asChild
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
        >
          <Link href={`/creator/${resolvedParams.creatorId}/posts?status=pending`}>
            Pending
          </Link>
        </Button>
        <Button
          asChild
          variant={statusFilter === 'rejected' ? 'default' : 'outline'}
          size="sm"
        >
          <Link href={`/creator/${resolvedParams.creatorId}/posts?status=rejected`}>
            Rejected
          </Link>
        </Button>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {statusFilter === 'all'
                ? 'No posts yet'
                : `No ${statusFilter} posts`}
            </p>
            <Button asChild>
              <Link href={`/creator/${resolvedParams.creatorId}/posts/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Submit Your First Post
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post._id.toString()} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {getStatusBadge(post.status)}
                  </div>
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <CardDescription className="line-clamp-1">
                  {post.postUrl}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metrics */}
                {post.latestMetrics && post.status === 'approved' && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>{post.latestMetrics.likes?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-green-500" />
                      <span>{post.latestMetrics.retweets?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span>{post.latestMetrics.replies?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span>{post.latestMetrics.impressions?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                )}

                {/* Admin Notes (if rejected) */}
                {post.status === 'rejected' && post.adminNotes && (
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <p className="text-sm text-red-500 font-medium mb-1">
                      Rejection Reason:
                    </p>
                    <p className="text-xs text-muted-foreground">{post.adminNotes}</p>
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground">
                  Submitted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/creator/${resolvedParams.creatorId}/posts/${post._id.toString()}`}>
                      View Details
                    </Link>
                  </Button>
                  {post.status === 'approved' && (
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/creator/${resolvedParams.creatorId}/posts/${post._id.toString()}/update`}>
                        Update Metrics
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
