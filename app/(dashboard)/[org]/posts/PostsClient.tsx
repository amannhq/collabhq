'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr/fetcher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PostsTable } from '@/components/posts/PostsTable';
import { PostsTableSkeleton } from '@/components/posts/PostsTableSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  createdAt: Date;
}

interface PostsData {
  posts: Post[];
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalPosts: number;
  };
}

interface PostsClientProps {
  organizationId: string;
  orgSlug: string;
  initialStatus?: string;
}

export function PostsClient({ organizationId, orgSlug, initialStatus = 'all' }: PostsClientProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, error, isLoading } = useSWR<{
    success: boolean;
    data: PostsData;
    error?: string;
  }>(`/api/posts/stats?orgId=${organizationId}&status=${currentStatus}&page=${page}&limit=${limit}`, fetcher, {
    dedupingInterval: 15000, // 15 seconds - posts change more frequently
    refreshInterval: 120000, // Auto-refresh every 2 minutes
    revalidateIfStale: true,
    keepPreviousData: true,
  });

  // Reset to page 1 when status or limit changes
  const handleStatusChange = (status: string) => {
    setCurrentStatus(status);
    setPage(1);
  };

  const handleLimitChange = (newLimit: string) => {
    setLimit(Number(newLimit));
    setPage(1);
  };

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Posts</h1>
            <p className="text-muted-foreground mt-1">
              Manage and review all creator posts
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load posts. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show skeleton only on initial load (when there's no data yet)
  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Posts</h1>
            <p className="text-muted-foreground mt-1">
              Manage and review all creator posts
            </p>
          </div>
        </div>
        <PostsTableSkeleton />
      </div>
    );
  }

  // Don't destructure until we know data exists
  const posts = data?.data?.posts || [];
  const counts = data?.data?.counts || { pending: 0, approved: 0, rejected: 0, total: 0 };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Posts</h1>
          <p className="text-muted-foreground mt-1">
            Manage and review all creator posts
          </p>
        </div>
        {counts.pending > 0 && (
          <Button asChild className="bg-zinc-900 hover:bg-zinc-800" size="lg">
            <Link href={`/${orgSlug}/posts/pending`}>
              <AlertCircle className="h-5 w-5" />
              {counts.pending} Post{counts.pending !== 1 ? 's' : ''} Pending Approval
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={currentStatus} onValueChange={handleStatusChange} className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All Posts ({counts.total})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({counts.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={currentStatus} className="mt-6 space-y-4">
          {data?.data?.pagination && (
            <>
              {/* Pagination Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <Select value={limit.toString()} onValueChange={handleLimitChange}>
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">posts per page</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {data.data.pagination.page} of {data.data.pagination.totalPages || 1}
                    {data.data.pagination.totalPosts > 0 && ` (${data.data.pagination.totalPosts} total)`}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Table */}
          <div className="relative rounded-lg border overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              {isLoading || !data ? (
                <PostsTableSkeleton />
              ) : (
                <PostsTable posts={posts} orgSlug={orgSlug} />
              )}
            </div>
          </div>

          {/* Pagination Navigation */}
          {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(data.data.pagination.totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (data.data.pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= data.data.pagination.totalPages - 2) {
                    pageNum = data.data.pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className={page === pageNum ? 'bg-zinc-900 hover:bg-zinc-800' : ''}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === data.data.pagination.totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
