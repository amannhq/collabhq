import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import connectDB from '@/lib/db/mongodb';
import { Project, Organization, Post, User } from '@/lib/db/models';
import type { IProject } from '@/lib/db/models/Project';
import type { IOrganization } from '@/lib/db/models/Organization';
import { ProjectCreators } from '@/components/projects/ProjectCreators';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProjectCreatorsPageProps {
  params: Promise<{
    org: string;
    projectId: string;
  }>;
}

export default async function ProjectCreatorsPage({ params }: ProjectCreatorsPageProps) {
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

  // Get creators assigned to this project
  const creators = await User.find({ 
    organizationId: organization._id,
    role: 'creator',
    'creatorProfile.projectId': project._id,
  }).lean();

  // Get post counts for each creator
  const creatorsWithStats = await Promise.all(
    creators.map(async (c) => {
      const creator = c as unknown as {
        _id: { toString(): string };
        name: string;
        email: string;
        creatorProfile?: {
          twitterHandle?: string;
          status?: string;
        };
      };

      const [totalPosts, approvedPosts, pendingPosts] = await Promise.all([
        Post.countDocuments({ 
          projectId: project._id, 
          creatorId: creator._id 
        }),
        Post.countDocuments({ 
          projectId: project._id, 
          creatorId: creator._id,
          status: 'approved' 
        }),
        Post.countDocuments({ 
          projectId: project._id, 
          creatorId: creator._id,
          status: 'pending' 
        }),
      ]);

      // Calculate total engagement
      const posts = await Post.find({ 
        projectId: project._id, 
        creatorId: creator._id,
        status: 'approved'
      }).lean();

      const totalEngagement = posts.reduce(
        (sum, p) =>
          sum +
          (p.latestMetrics?.likes || 0) +
          (p.latestMetrics?.retweets || 0) +
          (p.latestMetrics?.replies || 0),
        0
      );

      return {
        _id: creator._id.toString(),
        name: creator.name,
        email: creator.email,
        twitterHandle: creator.creatorProfile?.twitterHandle || '',
        status: creator.creatorProfile?.status || 'active',
        totalPosts,
        approvedPosts,
        pendingPosts,
        totalEngagement,
      };
    })
  );

  return (
    <div className="flex-1 space-y-6 p-6 pt-6">
      <div className="flex items-center gap-4">
        <Link href={`/${orgSlug}/projects/${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Project Creators</h2>
          <p className="text-muted-foreground mt-1">
            Manage creators contributing to {project.name}
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        }
      >
        <ProjectCreators
          projectName={project.name}
          organizationSlug={orgSlug}
          creators={creatorsWithStats}
        />
      </Suspense>
    </div>
  );
}
