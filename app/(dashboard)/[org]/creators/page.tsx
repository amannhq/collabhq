import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import connectDB from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { CreatorsClient } from './CreatorsClient';

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

export default async function CreatorsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Only fetch organization ID - client will handle data fetching
  await connectDB();
  const organization = await Organization.findOne({ slug: resolvedParams.org })
    .select('_id ownerId')
    .lean<IOrganization>();

  if (!organization) {
    redirect('/');
  }

  // Verify ownership
  if (organization.ownerId.toString() !== session.user.id) {
    redirect('/');
  }

  return (
    <CreatorsClient 
      organizationId={organization._id.toString()} 
      orgSlug={resolvedParams.org}
      initialView={resolvedSearchParams.view}
      initialSearch={resolvedSearchParams.search}
      initialProject={resolvedSearchParams.project}
      initialStatus={resolvedSearchParams.status}
    />
  );
}
