import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-utils';
import { EmailTemplateForm } from '@/components/email-templates/EmailTemplateForm';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  params: Promise<{ org: string; templateId: string }>;
}

export default async function EditEmailTemplatePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { org: orgSlug, templateId } = await params;

  // Get organization
  let orgResult;
  try {
    const orgResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/organizations?slug=${orgSlug}`,
      { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    if (!orgResponse.ok) {
      redirect('/');
    }
    
    orgResult = await orgResponse.json();
    
    if (!orgResult.success || !orgResult.data) {
      redirect('/');
    }
  } catch (error) {
    console.error('Error fetching organization:', error);
    redirect('/');
  }

  const organization = orgResult.data;

  // Check if user is admin
  const isAdmin =
    organization.adminId.toString() === session.user.id ||
    organization.memberIds?.some(
      (m: { userId: { toString(): string }; role?: string }) => m.userId.toString() === session.user.id && m.role === 'admin'
    );

  if (!isAdmin) {
    redirect(`/${orgSlug}/analytics`);
  }

  // Get template
  const templateResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/email-templates/${templateId}`,
    { cache: 'no-store' }
  );
  const templateResult = await templateResponse.json();

  if (!templateResult.success || !templateResult.data) {
    redirect(`/${orgSlug}/settings/email-templates`);
  }

  const template = templateResult.data;

  // Verify template belongs to organization
  if (template.organizationId.toString() !== organization._id.toString()) {
    redirect(`/${orgSlug}/settings/email-templates`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Email Template</h1>
        <p className="text-muted-foreground mt-2">
          Update the {template.name} template for your organization
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <EmailTemplateForm
          organizationId={organization._id}
          orgSlug={orgSlug}
          template={template}
          mode="edit"
        />
      </Suspense>
    </div>
  );
}
