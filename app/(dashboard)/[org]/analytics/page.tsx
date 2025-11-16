import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import connectDB from '@/lib/db/mongodb';
import { Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

interface AnalyticsPageProps {
  params: Promise<{
    org: string;
  }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const { org: orgSlug } = await params;

  // Only fetch organization ID - AnalyticsDashboard handles data fetching
  await connectDB();
  const organization = await Organization.findOne({ slug: orgSlug })
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
    <div className="flex-1 space-y-6 p-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your organization's performance
          </p>
        </div>
      </div>

      <AnalyticsDashboard organizationId={organization._id.toString()} />
    </div>
  );
}
