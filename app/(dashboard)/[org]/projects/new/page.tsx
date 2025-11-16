import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { CreateProjectForm } from '@/components/projects/CreateProjectForm';

interface PageProps {
  params: {
    org: string;
  };
}

async function getOrganization(orgSlug: string) {
  await connectDB();
  const organization = await Organization.findOne({ slug: orgSlug }).lean<IOrganization>();
  return organization;
}

export default async function NewProjectPage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await requireAuth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const organization = await getOrganization(resolvedParams.org);

  if (!organization) {
    redirect('/');
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Project</h2>
        <p className="text-muted-foreground">
          Set up a new project to start tracking creator content
        </p>
      </div>

      <CreateProjectForm 
        organizationId={organization._id.toString()} 
        orgSlug={resolvedParams.org} 
      />
    </div>
  );
}
