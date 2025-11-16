import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { Organization, Project } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import type { IProject } from '@/lib/db/models/Project';
import { ProjectList } from '@/components/projects/ProjectList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PageProps {
  params: {
    org: string;
  };
}

async function getProjectsData(orgSlug: string) {
  await connectDB();

  const organization = await Organization.findOne({ slug: orgSlug }).lean<IOrganization>();
  
  if (!organization) {
    return null;
  }

  // Get all projects with aggregated stats
  const projects = await Project.aggregate([
    { $match: { organizationId: organization._id } },
    {
      $lookup: {
        from: 'users',
        let: { projectId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$creatorProfile.projectId', '$$projectId']
              }
            }
          },
          { $count: 'count' }
        ],
        as: 'creatorStats'
      }
    },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'projectId',
        as: 'posts'
      }
    },
    {
      $addFields: {
        creatorCount: { $ifNull: [{ $arrayElemAt: ['$creatorStats.count', 0] }, 0] },
        postCount: { $size: '$posts' }
      }
    },
    { $project: { posts: 0, creatorStats: 0 } },
    { $sort: { createdAt: -1 } }
  ]);

  return {
    organization,
    projects: projects.map((p: IProject) => ({
      ...p,
      _id: p._id.toString(),
    })),
  };
}

export default async function ProjectsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await requireAuth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const data = await getProjectsData(resolvedParams.org);

  if (!data) {
    redirect('/');
  }

  const { projects } = data;

  // Group projects by status
  const activeProjects = projects.filter((p) => p.status === 'active');
  const pausedProjects = projects.filter((p) => p.status === 'paused');
  const completedProjects = projects.filter((p) => p.status === 'completed');
  const archivedProjects = projects.filter((p) => p.status === 'archived');

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage and track your content projects
          </p>
        </div>
        <Link href={`/${resolvedParams.org}/projects/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Projects Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeProjects.length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused ({pausedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ProjectList projects={projects} orgSlug={resolvedParams.org} />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <ProjectList projects={activeProjects} orgSlug={resolvedParams.org} />
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          <ProjectList projects={pausedProjects} orgSlug={resolvedParams.org} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <ProjectList projects={completedProjects} orgSlug={resolvedParams.org} />
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <ProjectList projects={archivedProjects} orgSlug={resolvedParams.org} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
