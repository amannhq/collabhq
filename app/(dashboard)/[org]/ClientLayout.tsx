'use client';

import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SWRProvider } from '@/components/providers/SWRProvider';

// Serialized organization type (ObjectIds converted to strings for Client Components)
// This is a plain object type, not a Mongoose document
type SerializedOrganization = {
  _id: string;
  ownerId: string;
  name: string;
  slug: string;
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    startDate: string | Date;
    expiresAt?: string | Date;
    stripePriceId?: string;
    stripeCustomerId?: string;
  };
  settings: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    notificationEmail: string;
    timezone: string;
    dateFormat: string;
    emailSignature?: string;
    emailFromName?: string;
    notifications?: {
      emailOnNewPost?: boolean;
      emailOnPostApproved?: boolean;
      emailOnPostRejected?: boolean;
      emailOnCreatorJoined?: boolean;
      emailOnWeeklyReport?: boolean;
      emailOnMonthlyReport?: boolean;
    };
  };
  limits: {
    maxProjects: number;
    maxCreators: number;
    maxPostsPerMonth: number;
  };
  usage: {
    projectsCount: number;
    creatorsCount: number;
    postsThisMonth: number;
    lastResetDate: string | Date;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
  __v?: number;
};

interface ClientLayoutProps {
  children: React.ReactNode;
  orgSlug: string;
  organization: SerializedOrganization;
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
        organizationId={organization._id}
        pendingPostsCount={pendingPostsCount}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-x-hidden">
        <Header
          orgSlug={orgSlug}
          orgName={organization.name}
          userName={session.user.name}
          userEmail={session.user.email}
          userId={session.user.id}
          organizationId={organization._id}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          <div className="p-4 lg:p-4 max-w-full">
            <SWRProvider>
              {children}
            </SWRProvider>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
