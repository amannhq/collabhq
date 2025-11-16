import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getSession } from '@/lib/auth'; // Use cached getSession
import { cache } from 'react';
import connectDB from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('org-layout');

// Cache the organization data for the request
const getOrganizationData = cache(async (orgSlug: string, userId: string) => {
  await connectDB();
  
  const organization = await Organization.findOne({
    slug: orgSlug,
  }).lean<IOrganization>();

  if (!organization) {
    logger.warn({ orgSlug, userId }, 'Organization not found');
    return null;
  }

  // Verify ownership
  const isOwner = organization.ownerId.toString() === userId;
  if (!isOwner) {
    logger.warn({ 
      orgId: organization._id.toString(),
      ownerId: organization.ownerId.toString(), 
      userId 
    }, 'User is not organization owner');
    return null;
  }

  // Get pending posts count in parallel with organization fetch
  const { Project, Post } = await import('@/lib/db/models');
  const projects = await Project.find({ organizationId: organization._id }).select('_id').lean();
  const projectIds = projects.map((p) => p._id);
  const pendingPostsCount = await Post.countDocuments({
    projectId: { $in: projectIds },
    status: 'pending',
  });

  return { organization, pendingPostsCount };
});

interface OrganizationLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    org: string;
  }>;
}

// Tell Next.js this layout doesn't need to revalidate on every request
export const dynamic = 'force-dynamic'; // Still dynamic for auth checks
export const revalidate = 0; // No static caching, but use React cache

export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  // Await params (Next.js 16)
  const resolvedParams = await params;

  // Get session (uses React cache from auth-utils)
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Get cached organization data
  const data = await getOrganizationData(resolvedParams.org, session.user.id);

  if (!data) {
    redirect('/');
  }

  const { organization, pendingPostsCount } = data;

  return (
    <SidebarProvider>
      <AdminSidebar
        orgSlug={resolvedParams.org}
        orgName={organization.name}
        userName={session.user.name}
        userEmail={session.user.email}
        userId={session.user.id}
        organizationId={organization._id.toString()}
        pendingPostsCount={pendingPostsCount}
      />
      <div className="flex flex-col flex-1">
        <Header
          orgSlug={resolvedParams.org}
          orgName={organization.name}
          userName={session.user.name}
          userEmail={session.user.email}
          userId={session.user.id}
          organizationId={organization._id.toString()}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
