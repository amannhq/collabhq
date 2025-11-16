import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { PendingPostsList } from '@/components/posts/PendingPostsList';
import { PostsTableSkeleton } from '@/components/posts/PostsTableSkeleton';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import { Organization, Post, Project } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';

interface PendingPostsPageProps {
  params: {
    org: string;
  };
}

async function getPendingPosts(organizationId: string) {
  await connectDB();

  // Get all projects for this org
  const projects = await Project.find({ organizationId }).select('_id').lean();
  const projectIds = projects.map((p: { _id: unknown }) => p._id);

  // Get pending posts
  const posts = await Post.find({
    projectId: { $in: projectIds },
    status: 'pending',
  })
    .populate('creatorId', 'name email twitterHandle')
    .populate('projectId', 'name settings')
    .sort({ createdAt: 1 }) // Oldest first
    .lean();

  // Type assertion for populated Mongoose results
  type PopulatedPost = {
    _id: string;
    postUrl: string;
    caption?: string;
    creatorId: { _id: string; name: string; email: string; twitterHandle?: string };
    projectId: { _id: string; name: string; settings?: { requirePostApproval?: boolean } };
    createdAt: Date;
  };
  
  return posts as unknown as PopulatedPost[];
}

export default async function PendingPostsPage({ params }: PendingPostsPageProps) {
  const resolvedParams = await params;
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

  const posts = await getPendingPosts(organization._id.toString());

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Posts</h1>
          <p className="text-muted-foreground">
            Review and approve posts from creators
          </p>
        </div>
        {posts.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
            <AlertCircle className="h-4 w-4" />
            <span>{posts.length} post{posts.length !== 1 ? 's' : ''} awaiting review</span>
          </div>
        )}
      </div>

      {/* Posts List */}
      <Suspense fallback={<PostsTableSkeleton />}>
        <PendingPostsList posts={posts} orgSlug={resolvedParams.org} />
      </Suspense>
    </div>
  );
}
