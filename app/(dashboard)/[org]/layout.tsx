import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getSession } from '@/lib/auth'; // Already cached
import { cache } from 'react';
import connectDB from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';

// CRITICAL: Consolidate ALL layout data into single cached function
// This ensures only ONE database query per request, making navigation instant
const getLayoutData = cache(async (orgSlug: string) => {
  // 1. Get session (already cached via React cache in auth-utils)
  const session = await getSession();
  
  if (!session) {
    return { session: null, organization: null, pendingPostsCount: 0 };
  }

  // 2. Connect to DB once
  await connectDB();
  
  // 3. Get organization (lean query for speed)
  const organization = await Organization.findOne({
    slug: orgSlug,
  }).lean<IOrganization>();

  if (!organization) {
    return { session, organization: null, pendingPostsCount: 0 };
  }

  // 4. Verify ownership
  const isOwner = organization.ownerId.toString() === session.user.id;
  if (!isOwner) {
    return { session, organization: null, pendingPostsCount: 0 };
  }

  // 5. Get pending posts count (only if needed)
  const { Project, Post } = await import('@/lib/db/models');
  const projects = await Project.find({ organizationId: organization._id }).select('_id').lean();
  const projectIds = projects.map((p) => p._id);
  const pendingPostsCount = await Post.countDocuments({
    projectId: { $in: projectIds },
    status: 'pending',
  });

  return { session, organization, pendingPostsCount };
});

interface OrganizationLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    org: string;
  }>;
}

// Force dynamic for auth, but React cache prevents redundant queries
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const resolvedParams = await params;

  // Get ALL layout data in one cached call
  // proxy.ts already verified cookie exists, so this is just validation
  const { session, organization, pendingPostsCount } = await getLayoutData(resolvedParams.org);

  // Fallback redirects (proxy.ts should prevent most of these)
  if (!session) {
    redirect('/login');
  }

  if (!organization) {
    redirect('/');
  }

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
