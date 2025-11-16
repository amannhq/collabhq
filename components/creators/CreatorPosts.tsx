'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  _id: string;
  postUrl: string;
  status: string;
  createdAt: Date;
  latestMetrics?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    impressions?: number;
  };
  projectId?: {
    _id: string;
    name: string;
  } | null;
}

interface CreatorPostsProps {
  posts: Post[];
  orgSlug: string;
}

export function CreatorPosts({ posts, orgSlug }: CreatorPostsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'rejected':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getTotalEngagement = (metrics?: Post['latestMetrics']) => {
    if (!metrics) return 0;
    return (metrics.likes || 0) + (metrics.retweets || 0) + (metrics.replies || 0);
  };

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No posts found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Card key={post._id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getStatusColor(post.status)} variant="secondary">
                  {post.status}
                </Badge>
                {post.projectId && (
                  <span className="text-sm text-muted-foreground">
                    {post.projectId.name}
                  </span>
                )}
              </div>
              <a
                href={post.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
              >
                {post.postUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {post.status === 'approved' && post.latestMetrics && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {getTotalEngagement(post.latestMetrics).toLocaleString()}
                  </span>
                </div>
              )}
              <Link href={`/${orgSlug}/posts/${post._id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
