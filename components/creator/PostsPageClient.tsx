'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ExternalLink, Heart, Repeat, MessageCircle, Eye, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSubmitPost } from '@/contexts/SubmitPostContext';

interface Post {
  _id: string;
  postUrl: string;
  status: string;
  latestMetrics?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    impressions?: number;
  };
  createdAt: string;
  adminNotes?: string;
}

interface PostsPageClientProps {
  creatorId: string;
  posts: Post[];
  statusFilter: string;
}

export default function PostsPageClient({ creatorId, posts, statusFilter }: PostsPageClientProps) {
  const { openModal } = useSubmitPost();
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">My Posts</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your submitted posts
            </p>
          </div>
          <Button
            onClick={openModal}
            className="bg-zinc-900 hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            Submit New Post
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className={statusFilter === 'all' ? 'bg-zinc-900 hover:bg-zinc-800' : ''}
          >
            <Link href={`/creator/${creatorId}/posts`}>All Posts</Link>
          </Button>
          <Button
            asChild
            variant={statusFilter === 'approved' ? 'default' : 'outline'}
            size="sm"
            className={statusFilter === 'approved' ? 'bg-zinc-900 hover:bg-zinc-800' : ''}
          >
            <Link href={`/creator/${creatorId}/posts?status=approved`}>
              Approved
            </Link>
          </Button>
          <Button
            asChild
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            className={statusFilter === 'pending' ? 'bg-zinc-900 hover:bg-zinc-800' : ''}
          >
            <Link href={`/creator/${creatorId}/posts?status=pending`}>
              Pending
            </Link>
          </Button>
          <Button
            asChild
            variant={statusFilter === 'rejected' ? 'default' : 'outline'}
            size="sm"
            className={statusFilter === 'rejected' ? 'bg-zinc-900 hover:bg-zinc-800' : ''}
          >
            <Link href={`/creator/${creatorId}/posts?status=rejected`}>
              Rejected
            </Link>
          </Button>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-900 mb-1">
                {statusFilter === 'all'
                  ? 'No posts yet'
                  : `No ${statusFilter} posts`}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {statusFilter === 'all'
                  ? 'Get started by submitting your first post'
                  : `You don't have any ${statusFilter} posts`}
              </p>
              <Button
                onClick={openModal}
                className="bg-zinc-900 hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Submit Your First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post._id} className="hover:shadow-md transition-shadow">
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
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Heart className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-zinc-900">{post.latestMetrics.likes?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Repeat className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-zinc-900">{post.latestMetrics.retweets?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-zinc-900">{post.latestMetrics.replies?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-zinc-900">{post.latestMetrics.impressions?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes (if rejected) */}
                  {post.status === 'rejected' && post.adminNotes && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 font-medium mb-1">
                        Rejection Reason:
                      </p>
                      <p className="text-xs text-red-600">{post.adminNotes}</p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/creator/${creatorId}/posts/${post._id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
