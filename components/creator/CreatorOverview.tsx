'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, Heart, Repeat, MessageCircle, Plus, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CreatorOverviewProps {
  creator: {
    _id: string;
    name: string;
    organization?: {
      name: string;
      slug: string;
    };
    project?: {
      name: string;
      description?: string;
    };
  };
  recentPosts: Array<{
    _id: string;
    postUrl: string;
    status: string;
    latestMetrics?: {
      likes?: number;
      retweets?: number;
      replies?: number;
      impressions?: number;
    };
    createdAt: Date;
    approvedAt?: Date;
  }>;
  creatorId: string;
}

export function CreatorOverview({ recentPosts, creatorId }: CreatorOverviewProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">Pending</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500/10 text-red-500">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your latest submitted content</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href={`/creator/${creatorId}/posts/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentPosts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No posts yet</p>
            <Button asChild size="sm">
              <Link href={`/creator/${creatorId}/posts/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Submit Your First Post
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div
                key={post._id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline flex items-center gap-1"
                    >
                      View Post <ExternalLink className="h-3 w-3" />
                    </a>
                    {getStatusBadge(post.status)}
                  </div>

                  {post.latestMetrics && post.status === 'approved' && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.latestMetrics.likes?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat className="h-3 w-3" />
                        {post.latestMetrics.retweets?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post.latestMetrics.replies?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.latestMetrics.impressions?.toLocaleString() || 0}
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <Button asChild variant="ghost" size="sm">
                  <Link href={`/creator/${creatorId}/posts/${post._id}`}>
                    View
                  </Link>
                </Button>
              </div>
            ))}

            <Button asChild variant="outline" className="w-full" size="sm">
              <Link href={`/creator/${creatorId}/posts`}>
                View All Posts
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
