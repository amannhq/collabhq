import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('org-layout');

interface OrganizationLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    org: string;
  }>;
}

export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  // Await params (Next.js 16)
  const resolvedParams = await params;

  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    logger.warn({ orgSlug: resolvedParams.org }, 'No session found, redirecting to login');
    redirect('/login');
  }

  logger.info({ 
    userId: session.user.id, 
    orgSlug: resolvedParams.org,
    emailVerified: session.user.emailVerified 
  }, 'Session found, checking organization access');

  // Get organization
  await connectDB();
  const organization = await Organization.findOne({
    slug: resolvedParams.org,
  }).lean<IOrganization>();

  if (!organization) {
    logger.warn({ orgSlug: resolvedParams.org, userId: session.user.id }, 'Organization not found');
    redirect('/');
  }

  logger.info({
    orgId: organization._id.toString(),
    ownerId: organization.ownerId.toString(),
    userId: session.user.id,
    match: organization.ownerId.toString() === session.user.id
  }, 'Checking organization ownership');

  // Verify user has access (owner only for now)
  const isOwner = organization.ownerId.toString() === session.user.id;

  if (!isOwner) {
    logger.warn({ 
      orgId: organization._id.toString(),
      ownerId: organization.ownerId.toString(), 
      userId: session.user.id 
    }, 'User is not organization owner, access denied');
    redirect('/');
  }

  // Get pending posts count
  const { Project, Post } = await import('@/lib/db/models');
  const projects = await Project.find({ organizationId: organization._id }).select('_id').lean();
  const projectIds = projects.map((p) => p._id);
  const pendingPostsCount = await Post.countDocuments({
    projectId: { $in: projectIds },
    status: 'pending',
  });

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
