import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import { getCachedOrganizationAccess } from '@/lib/auth/org-verification';
import { BrandingSettings } from '@/components/settings/BrandingSettings';
import { GeneralSettings } from '@/components/organization/GeneralSettings';
import { NotificationSettings } from '@/components/organization/NotificationSettings';
import { TeamSettings } from '@/components/organization/TeamSettings';
import { DangerZoneSettings } from '@/components/organization/DangerZoneSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  params: Promise<{ org: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { org: orgSlug } = await params;

  // Use cached organization verification (5 min cache)
  const orgAccess = await getCachedOrganizationAccess(orgSlug, session.user.id);

  if (!orgAccess) {
    redirect('/');
  }

  if (!orgAccess.isOwner) {
    redirect(`/${orgSlug}/analytics`);
  }

  const organization = orgAccess.organization;
  if (!organization) {
    redirect('/');
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization&apos;s settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <GeneralSettings
              organizationId={orgAccess.organizationId}
              currentSettings={{
                name: organization.name,
                slug: organization.slug,
              }}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <NotificationSettings
              organizationId={orgAccess.organizationId}
              currentSettings={organization.settings?.notifications || {}}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <TeamSettings organizationId={orgAccess.organizationId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <BrandingSettings
              organizationId={orgAccess.organizationId}
              currentSettings={{
                logo: organization.settings?.logo,
                primaryColor: organization.settings?.primaryColor || '#3b82f6',
                secondaryColor: organization.settings?.secondaryColor || '#10b981',
                notificationEmail: organization.settings?.notificationEmail,
                timezone: organization.settings?.timezone || 'UTC',
                dateFormat: organization.settings?.dateFormat || 'MM/DD/YYYY',
                emailSignature: organization.settings?.emailSignature,
                emailFromName: organization.settings?.emailFromName,
              }}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="danger" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <DangerZoneSettings
              organizationId={orgAccess.organizationId}
              organizationName={organization.name}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
