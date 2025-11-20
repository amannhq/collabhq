import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { User, Post } from '@/lib/db/models';
import type { IUser } from '@/lib/db/models/User';
import type { IPost } from '@/lib/db/models/Post';
import PostsPageClient from '@/components/creator/PostsPageClient';

interface CreatorPostsPageProps {
  params: Promise<{
    creatorId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function CreatorPostsPage({
  params,
  searchParams,
}: CreatorPostsPageProps) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  await connectDB();

  // Get creator
  const creator = await User.findById(resolvedParams.creatorId).select('role').lean() as unknown as IUser | null;

  if (!creator || creator.role !== 'creator') {
    redirect('/404');
  }

  // Security check
  if (session.user.id !== creator._id.toString()) {
    redirect('/unauthorized');
  }

  // Build query
  const query: { creatorId: unknown; status?: string } = { creatorId: creator._id };
  if (resolvedSearchParams.status && resolvedSearchParams.status !== 'all') {
    query.status = resolvedSearchParams.status;
  }

  // Get posts
  const posts = await Post.find(query)
    .select('postUrl status latestMetrics createdAt approvedAt rejectedAt adminNotes')
    .sort({ createdAt: -1 })
    .lean() as unknown as IPost[];

  const statusFilter = resolvedSearchParams.status || 'all';

  // Format posts for client component
  const formattedPosts = posts.map((post) => ({
    _id: post._id.toString(),
    postUrl: post.postUrl,
    status: post.status,
    latestMetrics: post.latestMetrics
      ? {
          likes: post.latestMetrics.likes || 0,
          retweets: post.latestMetrics.retweets || 0,
          replies: post.latestMetrics.replies || 0,
          impressions: post.latestMetrics.impressions || 0,
        }
      : undefined,
    createdAt: post.createdAt.toISOString(),
    adminNotes: post.adminNotes,
  }));

  return (
    <PostsPageClient
      creatorId={resolvedParams.creatorId}
      posts={formattedPosts}
      statusFilter={statusFilter}
    />
  );
}
