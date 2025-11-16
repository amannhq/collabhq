import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { Organization, Project } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { InviteCreatorForm } from '@/components/creators/InviteCreatorForm';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('invite-creator-page');

interface PageProps {
  params: {
    org: string;
  };
}

export default async function InviteCreatorPage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await requireAuth();

  await connectDB();
  const organization = await Organization.findOne({
    slug: resolvedParams.org,
  }).lean<IOrganization>();

  if (!organization) {
    redirect('/');
  }

  const isOwner = organization.ownerId.toString() === session.user.id;
  if (!isOwner) {
    redirect('/');
  }

  // Get all projects for this organization
  const projects = await Project.find({
    organizationId: organization._id,
    status: { $in: ['active', 'paused'] },
  })
    .select('name _id')
    .lean();

  logger.info(
    {
      orgId: organization._id.toString(),
      projectsCount: projects.length,
    },
    'Loaded invite creator page'
  );

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Invite Creator</h2>
        <p className="text-muted-foreground">
          Send an invitation to a new content creator to join your organization
        </p>
      </div>

      {/* Form */}
      <InviteCreatorForm
        organizationId={organization._id.toString()}
        orgSlug={resolvedParams.org}
        projects={(projects as Array<{ _id: { toString(): string }; name?: string }>).map((p) => ({
          _id: p._id.toString(),
          name: p.name || '',
        }))}
      />
    </div>
  );
}
