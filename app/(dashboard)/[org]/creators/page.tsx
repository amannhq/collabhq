import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import { getCachedOrganizationAccess } from '@/lib/auth/org-verification';
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

  // Use cached organization verification (5 min cache)
  const orgAccess = await getCachedOrganizationAccess(
    resolvedParams.org,
    session.user.id
  );

  if (!orgAccess || !orgAccess.isOwner) {
    redirect('/');
  }

  return (
    <CreatorsClient 
      organizationId={orgAccess.organizationId} 
      orgSlug={resolvedParams.org}
      initialView={resolvedSearchParams.view}
      initialSearch={resolvedSearchParams.search}
      initialProject={resolvedSearchParams.project}
      initialStatus={resolvedSearchParams.status}
    />
  );
}
