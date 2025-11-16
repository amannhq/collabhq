import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { Organization, User, Post } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { CreatorList } from '@/components/creators/CreatorList';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('creators-page');

interface PageProps {
  params: Promise<{
    org: string;
  }>;
  searchParams: Promise<{
    view?: 'grid' | 'list';
    search?: string;
    project?: string;
    status?: string;
  }>;
}

type CreatorWithProfile = {
  _id: { toString(): string };
  name?: string;
  email?: string;
  creatorProfile?: { twitterHandle?: string; status?: string };
  createdAt?: Date;
};

type PostMetrics = {
  latestMetrics?: { likes?: number; retweets?: number; replies?: number };
};

async function getCreators(orgId: string, filters: { status?: string; search?: string; project?: string }) {
  await connectDB();

  const query: Record<string, unknown> = {
    organizationId: orgId,
    role: 'creator',
  };

  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  }

  // Get creators
  const creators = await User.find(query)
    .select('name email creatorProfile createdAt')
    .lean() as unknown as CreatorWithProfile[];

  // Get post counts for each creator
  const creatorsWithStats = await Promise.all(
    creators.map(async (creator) => {
      const postsCount = await Post.countDocuments({
        organizationId: orgId,
        creatorId: creator._id,
      });

      const approvedPosts = await Post.countDocuments({
        organizationId: orgId,
        creatorId: creator._id,
        status: 'approved',
      });

      // Get total engagement
      const posts = await Post.find({
        organizationId: orgId,
        creatorId: creator._id,
        status: 'approved',
      })
        .select('latestMetrics')
        .lean() as unknown as PostMetrics[];

      const totalEngagement = posts.reduce((sum, post) => {
        const metrics = post.latestMetrics || {};
        return (
          sum +
          (metrics.likes || 0) +
          (metrics.retweets || 0) +
          (metrics.replies || 0)
        );
      }, 0);

      return {
        _id: creator._id.toString(),
        name: creator.name || '',
        email: creator.email || '',
        twitterHandle: creator.creatorProfile?.twitterHandle || '',
        status: creator.creatorProfile?.status || 'invited',
        createdAt: creator.createdAt || new Date(),
        postsCount,
        approvedPosts,
        totalEngagement,
      };
    })
  );

  // Apply search filter
  let filteredCreators = creatorsWithStats;
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredCreators = creatorsWithStats.filter(
      (creator) =>
        creator.name?.toLowerCase().includes(searchLower) ||
        creator.email?.toLowerCase().includes(searchLower) ||
        creator.twitterHandle?.toLowerCase().includes(searchLower)
    );
  }

  return filteredCreators;
}

export default async function CreatorsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const session = await requireAuth();

  await connectDB();
  const organization = await Organization.findOne({
    slug: resolvedParams.org,
  }).lean<IOrganization>();

  if (!organization) {
    redirect('/');
  }

  const isOwner = organization.ownerId.toString() === session.user.id;
  if (!isOwner) {
    redirect('/');
  }

  const filters = {
    search: resolvedSearchParams.search || '',
    project: resolvedSearchParams.project || 'all',
    status: resolvedSearchParams.status || 'all',
  };

  const creators = await getCreators(organization._id.toString(), filters);

  logger.info(
    {
      orgId: organization._id.toString(),
      creatorsCount: creators.length,
      filters,
    },
    'Fetched creators list'
  );

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Creators</h2>
          <p className="text-muted-foreground">
            Manage and track your content creators
          </p>
        </div>
        <Link href={`/${resolvedParams.org}/creators/invite`}>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Creator
          </Button>
        </Link>
      </div>

      {/* Creators List */}
      <CreatorList
        creators={creators}
        orgSlug={resolvedParams.org}
        view={resolvedSearchParams.view || 'grid'}
      />
    </div>
  );
}
