import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import { getCachedOrganizationAccess } from '@/lib/auth/org-verification';
import { ProjectsClient } from './ProjectsClient';

interface PageProps {
  params: Promise<{
    org: string;
  }>;
}

export default async function ProjectsPage({ params }: PageProps) {
  const resolvedParams = await params;
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

  return <ProjectsClient organizationId={orgAccess.organizationId} orgSlug={resolvedParams.org} />;
}
