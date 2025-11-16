import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import Invitation from '@/lib/db/models/Invitation';
import { AcceptInvitation } from '@/components/auth/AcceptInvitation';
import type { IInvitation } from '@/lib/db/models/Invitation';
import type { IOrganization } from '@/lib/db/models/Organization';
import type { IProject } from '@/lib/db/models/Project';

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  await connectDB();

  // Find invitation by token
  const invitationDoc = await Invitation.findOne({ token })
    .populate('organizationId')
    .populate('projectId')
    .populate('invitedBy', 'name email')
    .lean<IInvitation & {
      organizationId: IOrganization;
      projectId: IProject;
      invitedBy: { name: string; email: string };
    }>();

  // Handle invalid token
  if (!invitationDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
          <p className="text-muted-foreground mb-6">
            This invitation link is invalid or has expired.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  // Add isExpired method to the lean object
  const invitation = {
    ...invitationDoc,
    isExpired: () => invitationDoc.status === 'expired' || new Date(invitationDoc.expiresAt) < new Date()
  };

  // Handle expired invitation
  if (invitation.isExpired()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-orange-600 dark:text-orange-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Invitation Expired</h1>
          <p className="text-muted-foreground mb-6">
            This invitation has expired. Please contact{' '}
            <span className="font-medium">{invitationDoc.invitedBy.name}</span> to
            send a new invitation.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  // Handle already accepted invitation
  if (invitationDoc.status === 'accepted') {
    redirect('/login');
  }

  // Render acceptance form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <AcceptInvitation
        invitation={{
          token: invitationDoc.token,
          organizationName: invitationDoc.organizationId.name,
          projectName: invitationDoc.projectId.name,
          inviterName: invitationDoc.invitedBy.name,
          inviterEmail: invitationDoc.invitedBy.email,
          creatorName: invitationDoc.creatorData.name,
          email: invitationDoc.email,
          twitterHandle: invitationDoc.creatorData.twitterHandle,
          customMessage: invitationDoc.creatorData.customMessage,
          expiresAt: invitationDoc.expiresAt,
        }}
      />
    </div>
  );
}
