import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models';
import type { IUser } from '@/lib/db/models/User';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SubmitPostForm } from '@/components/creator/SubmitPostForm';

interface NewPostPageProps {
  params: Promise<{
    creatorId: string;
  }>;
}

export default async function NewPostPage({ params }: NewPostPageProps) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  await connectDB();

  // Get creator
  const creator = await User.findById(resolvedParams.creatorId)
    .select('role creatorProfile')
    .lean() as unknown as IUser | null;

  if (!creator || creator.role !== 'creator') {
    redirect('/404');
  }

  // Security check
  if (session.user.id !== creator._id.toString()) {
    redirect('/unauthorized');
  }

  return (
    <div className="space-y-6 max-w-2xl p-6">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm" className="hover:bg-zinc-100">
        <Link href={`/creator/${resolvedParams.creatorId}/posts`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Posts
        </Link>
      </Button>

      {/* Form */}
      <SubmitPostForm
        creatorId={resolvedParams.creatorId}
        projectId={creator.creatorProfile?.projectId?.toString()}
      />
    </div>
  );
}
