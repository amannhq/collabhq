'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Eye, ThumbsUp, Repeat2, MessageCircle, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Post {
  _id: string;
  postUrl: string;
  caption?: string;
  status: 'pending' | 'approved' | 'rejected';
  creatorId: {
    _id: string;
    name: string;
    email: string;
    twitterHandle?: string;
  };
  projectId: {
    _id: string;
    name: string;
  };
  latestMetrics?: {
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
  };
  createdAt: string | Date;
}

interface PostsTableProps {
  posts: Post[];
  orgSlug: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
  },
  approved: {
    label: 'Approved',
    variant: 'default' as const,
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive' as const,
  },
};

export function PostsTable({ posts, orgSlug }: PostsTableProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No posts found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No posts match the current filters
        </p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Creator</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Post</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Engagement</TableHead>
            <TableHead>Posted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post._id}>
              {/* Creator */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(post.creatorId.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{post.creatorId.name}</p>
                    {post.creatorId.twitterHandle && (
                      <p className="text-xs text-muted-foreground">
                        @{post.creatorId.twitterHandle}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Project */}
              <TableCell>
                <span className="text-sm font-medium">{post.projectId.name}</span>
              </TableCell>

              {/* Post */}
              <TableCell>
                <div className="max-w-xs">
                  {post.caption ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {post.caption}
                    </p>
                  ) : (
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      View post <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </TableCell>

              {/* Status */}
              <TableCell>
                <Badge variant={statusConfig[post.status].variant}>
                  {statusConfig[post.status].label}
                </Badge>
              </TableCell>

              {/* Engagement */}
              <TableCell>
                {post.latestMetrics ? (
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {formatNumber(post.latestMetrics.likes)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Repeat2 className="h-3 w-3" />
                      {formatNumber(post.latestMetrics.retweets)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {formatNumber(post.latestMetrics.replies)}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No data</span>
                )}
              </TableCell>

              {/* Posted Time */}
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <Link href={`/${orgSlug}/posts/${post._id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
