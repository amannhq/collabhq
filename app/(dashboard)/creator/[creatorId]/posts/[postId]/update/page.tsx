import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { User, Post } from '@/lib/db/models';
import type { IUser } from '@/lib/db/models/User';
import type { IPost } from '@/lib/db/models/Post';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { UpdateMetricsForm } from '@/components/creator/UpdateMetricsForm';

interface UpdateMetricsPageProps {
  params: Promise<{
    creatorId: string;
    postId: string;
  }>;
}

export default async function UpdateMetricsPage({ params }: UpdateMetricsPageProps) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  const resolvedParams = await params;
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

  // Get post
  const post = await Post.findById(resolvedParams.postId)
    .select('postUrl status latestMetrics creatorId')
    .lean() as unknown as IPost | null;

  if (!post || post.creatorId?.toString() !== creator._id.toString()) {
    redirect('/404');
  }

  // Only approved posts can have metrics updated
  if (post.status !== 'approved') {
    redirect(`/creator/${resolvedParams.creatorId}/posts/${resolvedParams.postId}`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm">
        <Link href={`/creator/${resolvedParams.creatorId}/posts/${resolvedParams.postId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Post Details
        </Link>
      </Button>

      {/* Form */}
      <UpdateMetricsForm
        postId={resolvedParams.postId}
        creatorId={resolvedParams.creatorId}
        currentMetrics={post.latestMetrics}
      />
    </div>
  );
}
