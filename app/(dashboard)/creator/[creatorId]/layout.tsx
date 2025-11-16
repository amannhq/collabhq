import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { User, Post } from '@/lib/db/models';
import type { IUser } from '@/lib/db/models/User';
import { CreatorSidebar } from '@/components/layout/CreatorSidebar';
import { Header } from '@/components/layout/Header';

interface CreatorLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    creatorId: string;
  }>;
}

export default async function CreatorLayout({
  children,
  params,
}: CreatorLayoutProps) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  await connectDB();

  // Get creator
  const creator = await User.findById(resolvedParams.creatorId)
    .select('role name email avatar creatorProfile organizationId')
    .lean() as unknown as IUser | null;

  if (!creator) {
    redirect('/404');
  }

  // Security check: Users can only access their own creator dashboard
  if (
    creator.role !== 'creator' ||
    session.user.id !== creator._id.toString()
  ) {
    redirect('/unauthorized');
  }

  // Get creator stats
  const [totalPosts, pendingPosts, totalEngagementResult] = await Promise.all([
    Post.countDocuments({ creatorId: creator._id }),
    Post.countDocuments({ creatorId: creator._id, status: 'pending' }),
    Post.aggregate([
      { $match: { creatorId: creator._id } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $add: [
                { $ifNull: ['$latestMetrics.likes', 0] },
                { $ifNull: ['$latestMetrics.retweets', 0] },
                { $ifNull: ['$latestMetrics.replies', 0] },
              ],
            },
          },
        },
      },
    ]),
  ]);

  const stats = {
    totalPosts,
    pendingPosts,
    totalEngagement: totalEngagementResult[0]?.total || 0,
  };

  const creatorData = {
    _id: creator._id.toString(),
    name: creator.name || '',
    email: creator.email || '',
    avatar: creator.avatar,
    creatorProfile: creator.creatorProfile
      ? {
          twitterHandle: creator.creatorProfile.twitterHandle,
          status: creator.creatorProfile.status,
        }
      : undefined,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <CreatorSidebar creator={creatorData} stats={stats} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-1 flex flex-col">
          <Header orgSlug="" orgName="" />
          <main className="flex-1 p-6">{children}</main>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
