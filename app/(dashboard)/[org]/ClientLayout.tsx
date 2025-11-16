'use client';

import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SWRProvider } from '@/components/providers/SWRProvider';
import type { IOrganization } from '@/lib/db/models/Organization';

interface ClientLayoutProps {
  children: React.ReactNode;
  orgSlug: string;
  organization: IOrganization;
  session: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  pendingPostsCount: number;
}

export function ClientLayout({
  children,
  orgSlug,
  organization,
  session,
  pendingPostsCount,
}: ClientLayoutProps) {
  // All data is passed from server component once
  // Navigation is instant - no server queries
  return (
    <SidebarProvider>
      <AdminSidebar
        orgSlug={orgSlug}
        orgName={organization.name}
        userName={session.user.name}
        userEmail={session.user.email}
        userId={session.user.id}
        organizationId={organization._id.toString()}
        pendingPostsCount={pendingPostsCount}
      />
      <div className="flex flex-col flex-1">
        <Header
          orgSlug={orgSlug}
          orgName={organization.name}
          userName={session.user.name}
          userEmail={session.user.email}
          userId={session.user.id}
          organizationId={organization._id.toString()}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-4 lg:p-6">
            <SWRProvider>
              {children}
            </SWRProvider>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
