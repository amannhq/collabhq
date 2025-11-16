import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import { getCachedOrganizationAccess } from '@/lib/auth/org-verification';
import { PostsClient } from './PostsClient';

interface PostsPageProps {
  params: Promise<{
    org: string;
  }>;
  searchParams: Promise<{
    status?: string;
    project?: string;
    creator?: string;
    search?: string;
  }>;
}

export default async function PostsPage({ params, searchParams }: PostsPageProps) {
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
    <PostsClient 
      organizationId={orgAccess.organizationId} 
      orgSlug={resolvedParams.org}
      initialStatus={resolvedSearchParams.status}
    />
  );
}
