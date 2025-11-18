import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { ClientLayout } from './ClientLayout';

interface OrganizationLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    org: string;
  }>;
}

// CRITICAL: This only runs on initial page load, not on navigation
// Navigation is handled client-side for instant transitions
export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const resolvedParams = await params;

  // 1. Get session (proxy.ts already verified cookie exists)
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // 2. Get organization data ONCE on initial load
  await connectDB();
  
  const organization = await Organization.findOne({
    slug: resolvedParams.org,
  }).lean<IOrganization>();

  if (!organization) {
    redirect('/');
  }

  // 3. Verify ownership
  const isOwner = organization.ownerId.toString() === session.user.id;
  if (!isOwner) {
    redirect('/');
  }

  // 4. Get pending posts count
  const { Post } = await import('@/lib/db/models');
  const pendingPostsCount = await Post.countDocuments({
    organizationId: organization._id,
    status: 'pending',
  });

  // Serialize organization object - convert ObjectIds to strings for Client Component
  // This prevents "Objects with toJSON methods" error when passing to Client Components
  // JSON.stringify automatically calls toJSON() on ObjectIds, converting them to strings
  const serializedOrganization = JSON.parse(
    JSON.stringify(organization)
  ) as {
    _id: string;
    ownerId: string;
    name: string;
    slug: string;
    subscription: IOrganization['subscription'];
    settings: IOrganization['settings'];
    limits: IOrganization['limits'];
    usage: IOrganization['usage'];
    createdAt: string;
    updatedAt: string;
    __v?: number;
  };

  // Pass all data to client component
  // Client component handles navigation without server queries
  const clientSafeSession = {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
  };

  return (
    <ClientLayout
      orgSlug={resolvedParams.org}
      organization={serializedOrganization}
      session={clientSafeSession}
      pendingPostsCount={pendingPostsCount}
    >
      {children}
    </ClientLayout>
  );
}
