import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { Organization, User, Post } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { CreatorProfile } from '@/components/creators/CreatorProfile';
import { CreatorPosts } from '@/components/creators/CreatorPosts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('creator-profile-page');

interface PageProps {
  params: {
    org: string;
    creatorId: string;
  };
}

type PopulatedCreatorPost = {
  _id: { toString(): string };
  postUrl?: string;
  status?: string;
  createdAt?: Date;
  latestMetrics?: { likes?: number; retweets?: number; replies?: number };
  projectId?: { _id: { toString(): string }; name?: string };
};

type CreatorLean = {
  _id: { toString(): string };
  name?: string;
  email?: string;
  creatorProfile?: { twitterHandle?: string; status?: string };
  createdAt?: Date;
};

async function getCreatorData(orgId: string, creatorId: string) {
  await connectDB();

  const creator = await User.findOne({
    _id: creatorId,
    organizationId: orgId,
    role: 'creator',
  }).lean() as unknown as CreatorLean | null;

  if (!creator) {
    return null;
  }

  const posts = await Post.find({
    organizationId: orgId,
    creatorId,
  })
    .populate('projectId', 'name')
    .sort({ createdAt: -1 })
    .lean() as unknown as PopulatedCreatorPost[];

  const totalPosts = posts.length;
  const approvedPosts = posts.filter((p) => p.status === 'approved').length;
  const pendingPosts = posts.filter((p) => p.status === 'pending').length;
  const rejectedPosts = posts.filter((p) => p.status === 'rejected').length;

  const totalEngagement = posts.reduce((sum, post) => {
    const metrics = post.latestMetrics || {};
    return (
      sum +
      (metrics.likes || 0) +
      (metrics.retweets || 0) +
      (metrics.replies || 0)
    );
  }, 0);

  const avgEngagement = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0;

  return {
    creator: {
      _id: creator._id.toString(),
      name: creator.name || '',
      email: creator.email || '',
      twitterHandle: creator.creatorProfile?.twitterHandle || '',
      status: creator.creatorProfile?.status || 'invited',
      createdAt: creator.createdAt || new Date(),
    },
    posts: posts.map((p) => ({
      _id: p._id.toString(),
      postUrl: p.postUrl || '',
      status: p.status || 'pending',
      createdAt: p.createdAt || new Date(),
      latestMetrics: p.latestMetrics,
      projectId: p.projectId
        ? {
            _id: p.projectId._id.toString(),
            name: p.projectId.name || '',
          }
        : null,
    })),
    stats: {
      totalPosts,
      approvedPosts,
      pendingPosts,
      rejectedPosts,
      totalEngagement,
      avgEngagement,
    },
  };
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const resolvedParams = await params;
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

  const data = await getCreatorData(
    organization._id.toString(),
    resolvedParams.creatorId
  );

  if (!data) {
    redirect(`/${resolvedParams.org}/creators`);
  }

  logger.info(
    {
      orgId: organization._id.toString(),
      creatorId: resolvedParams.creatorId,
      postsCount: data.posts.length,
    },
    'Loaded creator profile'
  );

  return (
    <div className="flex-1 space-y-6">
      {/* Creator Profile */}
      <CreatorProfile
        creator={data.creator}
        stats={data.stats}
        orgSlug={resolvedParams.org}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.approvedPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <XCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.pendingPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.totalEngagement.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {data.stats.avgEngagement.toLocaleString()} per post
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Posts ({data.stats.totalPosts})</TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({data.stats.approvedPosts})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({data.stats.pendingPosts})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({data.stats.rejectedPosts})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <CreatorPosts posts={data.posts} orgSlug={resolvedParams.org} />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <CreatorPosts
            posts={data.posts.filter((p) => p.status === 'approved')}
            orgSlug={resolvedParams.org}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <CreatorPosts
            posts={data.posts.filter((p) => p.status === 'pending')}
            orgSlug={resolvedParams.org}
          />
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <CreatorPosts
            posts={data.posts.filter((p) => p.status === 'rejected')}
            orgSlug={resolvedParams.org}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
