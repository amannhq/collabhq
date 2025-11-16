import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import connectDB from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
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
    <PostsClient 
      organizationId={organization._id.toString()} 
      orgSlug={resolvedParams.org}
      initialStatus={resolvedSearchParams.status}
    />
  );
}
