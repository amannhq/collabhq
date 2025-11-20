'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, Heart, Repeat, MessageCircle, Plus, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSubmitPost } from '@/contexts/SubmitPostContext';

interface CreatorOverviewProps {
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
    createdAt: string;
    approvedAt?: string;
  }>;
  creatorId: string;
}

export function CreatorOverview({ recentPosts, creatorId }: CreatorOverviewProps) {
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Posts</CardTitle>
            <CardDescription className="text-xs">Your latest submitted content</CardDescription>
          </div>
          <Button
            onClick={openModal}
            size="sm"
            className="bg-zinc-900 hover:bg-zinc-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentPosts.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-900 mb-1">No posts yet</p>
            <p className="text-xs text-muted-foreground mb-4">Get started by submitting your first post</p>
            <Button
              onClick={openModal}
              size="sm"
              className="bg-zinc-900 hover:bg-zinc-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Submit Your First Post
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div
                key={post._id}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors"
              >
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-zinc-900 hover:text-zinc-700 hover:underline flex items-center gap-1"
                    >
                      View Post <ExternalLink className="h-3 w-3" />
                    </a>
                    {getStatusBadge(post.status)}
                  </div>

                  {post.latestMetrics && post.status === 'approved' && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span className="font-medium">{post.latestMetrics.likes?.toLocaleString() || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat className="h-3 w-3" />
                        <span className="font-medium">{post.latestMetrics.retweets?.toLocaleString() || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span className="font-medium">{post.latestMetrics.replies?.toLocaleString() || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span className="font-medium">{post.latestMetrics.impressions?.toLocaleString() || 0}</span>
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <Button asChild variant="ghost" size="sm" className="flex-shrink-0">
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
