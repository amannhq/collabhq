import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import connectDB from '@/lib/db/mongodb';
import { Project, Organization, Post, User } from '@/lib/db/models';
import type { IProject } from '@/lib/db/models/Project';
import type { IOrganization } from '@/lib/db/models/Organization';
import { ProjectDetail } from '@/components/projects/ProjectDetail';
import { ProjectStats } from '@/components/projects/ProjectStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProjectPageProps {
  params: Promise<{
    org: string;
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const { org: orgSlug, projectId } = await params;

  await connectDB();
  
  const organization = await Organization.findOne({ slug: orgSlug }).lean() as IOrganization | null;

  if (!organization) {
    redirect('/');
  }

  // Check if user is owner
  if (organization.ownerId.toString() !== session.user.id) {
    redirect(`/${orgSlug}`);
  }

  const project = await Project.findById(projectId).lean() as IProject | null;

  if (!project || project.organizationId.toString() !== organization._id.toString()) {
    redirect(`/${orgSlug}/projects`);
  }

  // Get project stats
  const [totalPosts, approvedPosts, pendingPosts, creators] = await Promise.all([
    Post.countDocuments({ projectId: project._id }),
    Post.countDocuments({ projectId: project._id, status: 'approved' }),
    Post.countDocuments({ projectId: project._id, status: 'pending' }),
    User.countDocuments({ 
      _id: { 
        $in: await Post.distinct('creatorId', { projectId: project._id }) 
      } 
    }),
  ]);

  // Calculate engagement metrics
  const posts = await Post.find({ projectId: project._id, status: 'approved' }).lean();
  const totalEngagement = posts.reduce(
    (sum, p) =>
      sum +
      (p.latestMetrics?.likes || 0) +
      (p.latestMetrics?.retweets || 0) +
      (p.latestMetrics?.replies || 0),
    0
  );
  const totalImpressions = posts.reduce(
    (sum, p) => sum + (p.latestMetrics?.impressions || 0),
    0
  );
  const avgEngagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

  const stats = {
    totalPosts,
    approvedPosts,
    pendingPosts,
    totalCreators: creators,
    totalEngagement,
    totalImpressions,
    avgEngagementRate,
  };

  return (
    <div className="flex-1 space-y-6 p-6 pt-6">
      <div className="flex items-center gap-4">
        <Link href={`/${orgSlug}/projects`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <ProjectStats stats={stats} />
      </Suspense>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        }
      >
        <ProjectDetail
          project={{
            _id: project._id.toString(),
            name: project.name,
            description: project.description,
            status: project.status,
            settings: project.settings,
            organizationId: organization._id.toString(),
          }}
          organizationSlug={orgSlug}
        />
      </Suspense>
    </div>
  );
}
