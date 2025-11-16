import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PostsTable } from '@/components/posts/PostsTable';
import { PostsTableSkeleton } from '@/components/posts/PostsTableSkeleton';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import { Organization, Post } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';

interface PostsPageProps {
  params: Promise<{
    org: string;
  }>;
  searchParams: Promise<{
    status?: string;
    project?: string;
    creator?: string;
    search?: string;
  }>;
}

type SearchFilters = {
  status?: string;
  project?: string;
  creator?: string;
  search?: string;
};

async function getPostsData(organizationId: string, filters: SearchFilters) {
  await connectDB();

  const query: Record<string, unknown> = {};

  // Get all projects for this org to filter posts
  const { Project } = await import('@/lib/db/models');
  const projects = await Project.find({ organizationId }).select('_id').lean();
  const projectIds = projects.map((p) => p._id);

  query.projectId = { $in: projectIds };

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  }

  if (filters.project) {
    query.projectId = filters.project;
  }

  if (filters.creator) {
    query.creatorId = filters.creator;
  }

  if (filters.search) {
    query.$or = [
      { postUrl: { $regex: filters.search, $options: 'i' } },
      { caption: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const posts = await Post.find(query)
    .populate('creatorId', 'name email twitterHandle')
    .populate('projectId', 'name')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Transform for component interface
  type PostLean = {
    _id: { toString(): string };
    postUrl?: string;
    caption?: string;
    status?: string;
    creatorId?: { _id: { toString(): string }; name?: string; email?: string; twitterHandle?: string };
    projectId?: { _id: { toString(): string }; name?: string };
    latestMetrics?: { likes?: number; retweets?: number; replies?: number; impressions?: number };
    createdAt?: Date;
  };

  const transformedPosts = (posts as unknown as PostLean[]).map((p) => ({
    _id: p._id.toString(),
    postUrl: p.postUrl || '',
    caption: p.caption,
    status: (p.status || 'pending') as 'pending' | 'approved' | 'rejected',
    creatorId: {
      _id: p.creatorId?._id.toString() || '',
      name: p.creatorId?.name || '',
      email: p.creatorId?.email || '',
      twitterHandle: p.creatorId?.twitterHandle,
    },
    projectId: {
      _id: p.projectId?._id.toString() || '',
      name: p.projectId?.name || '',
    },
    latestMetrics: p.latestMetrics ? {
      likes: p.latestMetrics.likes || 0,
      retweets: p.latestMetrics.retweets || 0,
      replies: p.latestMetrics.replies || 0,
      impressions: p.latestMetrics.impressions || 0,
    } : undefined,
    createdAt: p.createdAt || new Date(),
  }));

  // Get counts for tabs
  const pendingCount = await Post.countDocuments({
    projectId: { $in: projectIds },
    status: 'pending',
  });

  const approvedCount = await Post.countDocuments({
    projectId: { $in: projectIds },
    status: 'approved',
  });

  const rejectedCount = await Post.countDocuments({
    projectId: { $in: projectIds },
    status: 'rejected',
  });

  return {
    posts: transformedPosts,
    counts: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: pendingCount + approvedCount + rejectedCount,
    },
  };
}

export default async function PostsPage({ params, searchParams }: PostsPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
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

  const { posts, counts } = await getPostsData(organization._id.toString(), resolvedSearchParams);

  const currentStatus = resolvedSearchParams.status || 'all';

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
            <Link href={`/${resolvedParams.org}/posts/pending`}>
              <AlertCircle className="mr-2 h-5 w-5" />
              {counts.pending} Post{counts.pending !== 1 ? 's' : ''} Pending Approval
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={currentStatus} className="w-full">
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
          <Suspense fallback={<PostsTableSkeleton />}>
          <PostsTable posts={posts} orgSlug={resolvedParams.org} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
