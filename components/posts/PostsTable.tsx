'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Eye, ThumbsUp, Repeat2, MessageCircle, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    className: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
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

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <table className="w-full border-collapse">
      <thead className="bg-zinc-50 sticky top-0 z-10">
        <tr className="border-b-2 border-zinc-200">
          <th className="py-3.5 px-4 text-left text-xs font-semibold text-zinc-900 uppercase tracking-wide bg-zinc-50 w-[180px]">
            Creator
          </th>
          <th className="py-3.5 px-4 text-left text-xs font-semibold text-zinc-900 uppercase tracking-wide bg-zinc-50 w-[140px]">
            Project
          </th>
          <th className="py-3.5 px-4 text-left text-xs font-semibold text-zinc-900 uppercase tracking-wide bg-zinc-50 w-[200px]">
            Post
          </th>
          <th className="py-3.5 px-4 text-left text-xs font-semibold text-zinc-900 uppercase tracking-wide bg-zinc-50 w-[100px]">
            Status
          </th>
          <th className="py-3.5 px-4 text-left text-xs font-semibold text-zinc-900 uppercase tracking-wide bg-zinc-50 w-[200px]">
            Engagement
          </th>
          <th className="py-3.5 px-4 text-left text-xs font-semibold text-zinc-900 uppercase tracking-wide bg-zinc-50 w-[130px]">
            Posted
          </th>
          <th className="py-3.5 px-4 text-center text-xs font-semibold text-zinc-900 uppercase tracking-wide bg-zinc-50 w-[70px]">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-zinc-100">
        {posts.map((post) => (
          <tr key={post._id} className="hover:bg-zinc-50/50 transition-colors">
            {/* Creator */}
            <td className="py-4 px-4 align-top">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {post.creatorId.name}
                </p>
                {post.creatorId.twitterHandle && (
                  <p className="text-xs text-zinc-500 truncate">
                    @{post.creatorId.twitterHandle}
                  </p>
                )}
              </div>
            </td>

            {/* Project */}
            <td className="py-4 px-4 align-top">
              <span className="text-sm font-medium text-zinc-900">
                {post.projectId.name}
              </span>
            </td>

            {/* Post */}
            <td className="py-4 px-4 align-top">
              <div className="max-w-xs">
                {post.caption ? (
                  <p className="line-clamp-2 text-sm text-zinc-600 leading-relaxed">
                    {post.caption}
                  </p>
                ) : (
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                  >
                    View post <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </td>

            {/* Status */}
            <td className="py-4 px-4 align-top">
              <Badge className={statusConfig[post.status].className}>
                {statusConfig[post.status].label}
              </Badge>
            </td>

            {/* Engagement */}
            <td className="py-4 px-4 align-top">
              {post.latestMetrics ? (
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    <ThumbsUp className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="font-medium">{formatNumber(post.latestMetrics.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    <Repeat2 className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="font-medium">{formatNumber(post.latestMetrics.retweets)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    <MessageCircle className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="font-medium">{formatNumber(post.latestMetrics.replies)}</span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-zinc-400 font-medium">No data</span>
              )}
            </td>

            {/* Posted Time */}
            <td className="py-4 px-4 align-top">
              <span className="text-sm text-zinc-600">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </td>

            {/* Actions */}
            <td className="py-4 px-4 align-top text-center">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0 hover:bg-zinc-100"
              >
                <Link href={`/${orgSlug}/posts/${post._id}`}>
                  <Eye className="h-4 w-4 text-zinc-600" />
                </Link>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
