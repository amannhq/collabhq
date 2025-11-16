import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';

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
    redirect('/login');
  }

  // Get organization
  await connectDB();
  const organization = await Organization.findOne({
    slug: resolvedParams.org,
  }).lean<IOrganization>();

  if (!organization) {
    redirect('/');
  }

  // Verify user has access (owner only for now)
  const isOwner = organization.ownerId.toString() === session.user.id;

  if (!isOwner) {
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
