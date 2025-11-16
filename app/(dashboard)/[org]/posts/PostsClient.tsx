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
import { AlertCircle } from 'lucide-react';

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
}

interface PostsClientProps {
  organizationId: string;
  orgSlug: string;
  initialStatus?: string;
}

export function PostsClient({ organizationId, orgSlug, initialStatus = 'all' }: PostsClientProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  const { data, error, isLoading } = useSWR<{
    success: boolean;
    data: PostsData;
    error?: string;
  }>(`/api/posts/stats?orgId=${organizationId}&status=${currentStatus}`, fetcher);

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
            <p className="text-muted-foreground">
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
            <p className="text-muted-foreground">
              Manage and review all creator posts
            </p>
          </div>
        </div>
        <PostsTableSkeleton />
      </div>
    );
  }

  const { posts, counts } = data?.data || { posts: [], counts: { pending: 0, approved: 0, rejected: 0, total: 0 } };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground">
            Manage and review all creator posts
          </p>
        </div>
        {counts.pending > 0 && (
          <Button asChild variant="default" size="lg">
            <Link href={`/${orgSlug}/posts/pending`}>
              <AlertCircle className="mr-2 h-5 w-5" />
              {counts.pending} Post{counts.pending !== 1 ? 's' : ''} Pending Approval
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={currentStatus} onValueChange={setCurrentStatus} className="w-full">
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

        <TabsContent value={currentStatus} className="mt-6">
          {isLoading ? (
            <PostsTableSkeleton />
          ) : (
            <PostsTable posts={posts} orgSlug={orgSlug} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
