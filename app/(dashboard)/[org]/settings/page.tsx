import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import connectDB from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import { BrandingSettings } from '@/components/settings/BrandingSettings';
import { GeneralSettings } from '@/components/organization/GeneralSettings';
import { NotificationSettings } from '@/components/organization/NotificationSettings';
import { TeamSettings } from '@/components/organization/TeamSettings';
import { DangerZoneSettings } from '@/components/organization/DangerZoneSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { IOrganization } from '@/lib/db/models/Organization';

interface Props {
  params: Promise<{ org: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { org: orgSlug } = await params;

  // Get organization directly from database (we're in a server component)
  await connectDB();
  const organization = await Organization.findOne({ slug: orgSlug }).lean() as IOrganization | null;

  if (!organization) {
    console.error(`Organization with slug '${orgSlug}' not found`);
    redirect('/');
  }

  // Check if user is owner
  const isOwner = organization.ownerId.toString() === session.user.id;

  if (!isOwner) {
    console.error(`User ${session.user.id} is not owner of organization ${organization._id}. Owner is ${organization.ownerId}`);
    redirect(`/${orgSlug}/analytics`);
  }

  return (
    <div className="space-y-6">
            <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
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
              organizationId={organization._id.toString()}
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
              organizationId={organization._id.toString()}
              currentSettings={organization.settings?.notifications || {}}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <TeamSettings organizationId={organization._id.toString()} />
          </Suspense>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <BrandingSettings
              organizationId={organization._id.toString()}
              currentSettings={organization.settings}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="danger" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <DangerZoneSettings
              organizationId={organization._id.toString()}
              organizationName={organization.name}
            //   organizationSlug={organization.slug}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
