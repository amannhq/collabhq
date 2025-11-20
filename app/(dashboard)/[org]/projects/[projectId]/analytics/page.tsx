import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import connectDB from '@/lib/db/mongodb';
import { Project, Organization } from '@/lib/db/models';
import type { IProject } from '@/lib/db/models/Project';
import type { IOrganization } from '@/lib/db/models/Organization';
import { ImprovedProjectAnalytics } from '@/components/projects/ImprovedProjectAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProjectAnalyticsPageProps {
  params: Promise<{
    org: string;
    projectId: string;
  }>;
}

export default async function ProjectAnalyticsPage({ params }: ProjectAnalyticsPageProps) {
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
          <h2 className="text-3xl font-bold tracking-tight">Project Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Performance insights for {project.name}
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          </div>
        }
      >
        <ImprovedProjectAnalytics
          projectId={project._id.toString()}
          organizationId={organization._id.toString()}
        />
      </Suspense>
    </div>
  );
}
