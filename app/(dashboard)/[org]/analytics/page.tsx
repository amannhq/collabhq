import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import { getCachedOrganizationAccess } from '@/lib/auth/org-verification';
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

  // Use cached organization verification (5 min cache)
  const orgAccess = await getCachedOrganizationAccess(orgSlug, session.user.id);

  if (!orgAccess || !orgAccess.isOwner) {
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

      <AnalyticsDashboard organizationId={orgAccess.organizationId} />
    </div>
  );
}
