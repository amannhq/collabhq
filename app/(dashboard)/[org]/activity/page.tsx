import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import { getCachedOrganizationAccess } from '@/lib/auth/org-verification';
import { ActivityClient } from './ActivityClient';

interface PageProps {
  params: Promise<{
    org: string;
  }>;
}

export default async function ActivityPage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const orgAccess = await getCachedOrganizationAccess(
    resolvedParams.org,
    session.user.id,
  );

  if (!orgAccess || (!orgAccess.isOwner && session.user.role !== 'saas-admin')) {
    redirect('/');
  }

  return (
    <ActivityClient
      organizationId={orgAccess.organizationId}
      orgSlug={resolvedParams.org}
    />
  );
}

