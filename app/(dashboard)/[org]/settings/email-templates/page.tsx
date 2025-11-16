import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { Organization, EmailTemplate } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Edit,
  Eye,
  Mail,
  Plus,
} from 'lucide-react';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('email-templates-page');

interface PageProps {
  params: {
    org: string;
  };
}

async function getEmailTemplates(orgId: string) {
  await connectDB();

  const templates = await EmailTemplate.find({ organizationId: orgId })
    .sort({ createdAt: -1 })
    .lean();

  type TemplateLean = { _id: { toString(): string }; name?: string; slug?: string; category?: string; subject?: string; isActive?: boolean; isDefault?: boolean; usageCount?: number; lastUsedAt?: Date; createdAt?: Date };
  return (templates as TemplateLean[]).map((t) => ({
    _id: t._id.toString(),
    name: t.name,
    slug: t.slug,
    category: t.category,
    subject: t.subject,
    isActive: t.isActive,
    isDefault: t.isDefault,
    usageCount: t.usageCount,
    lastUsedAt: t.lastUsedAt,
    createdAt: t.createdAt,
  }));
}

export default async function EmailTemplatesPage({ params }: PageProps) {
  await requireAuth();
  const resolvedParams = await params;

  await connectDB();

  const organization = (await Organization.findOne({
    slug: resolvedParams.org,
  }).lean()) as IOrganization | null;

  if (!organization) {
        redirect('/');;
  }

  const templates = await getEmailTemplates(organization._id.toString());

  logger.info(
    {
      orgId: organization._id.toString(),
      templatesCount: templates.length,
    },
    'Loaded email templates page'
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transactional':
        return 'bg-blue-500/10 text-blue-500';
      case 'marketing':
        return 'bg-purple-500/10 text-purple-500';
      case 'notification':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground">
            Customize your email templates with your brand colors and messaging
          </p>
        </div>
        <Button asChild>
          <Link href={`/${resolvedParams.org}/settings/email-templates/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No email templates yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first email template to customize your brand experience
            </p>
            <Button asChild>
              <Link href={`/${resolvedParams.org}/settings/email-templates/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {template.slug}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {template.isDefault && (
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                        Default
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className={template.isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Subject:</p>
                  <p className="text-sm font-medium">{template.subject}</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Badge variant="secondary" className={getCategoryColor(template.category || 'other')}>
                    {template.category}
                  </Badge>
                  <span className="text-muted-foreground">
                    Used {template.usageCount} times
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/${resolvedParams.org}/settings/email-templates/${template._id}/preview`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/${resolvedParams.org}/settings/email-templates/${template._id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Default Templates Info */}
      <Card>
        <CardHeader>
          <CardTitle>About Email Templates</CardTitle>
          <CardDescription>
            How to customize your email templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Available Template Types:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>invitation</strong> - Sent when inviting new creators</li>
              <li><strong>welcome</strong> - Sent when creator accepts invitation</li>
              <li><strong>reminder</strong> - Sent to remind creators about pending posts</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Template Variables:</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Use these variables in your templates - they&apos;ll be replaced with actual data:
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="px-2 py-1 bg-muted rounded text-xs">{'{{name}}'}</code>
              <code className="px-2 py-1 bg-muted rounded text-xs">{'{{email}}'}</code>
              <code className="px-2 py-1 bg-muted rounded text-xs">{'{{organizationName}}'}</code>
              <code className="px-2 py-1 bg-muted rounded text-xs">{'{{projectName}}'}</code>
              <code className="px-2 py-1 bg-muted rounded text-xs">{'{{inviteUrl}}'}</code>
              <code className="px-2 py-1 bg-muted rounded text-xs">{'{{dashboardUrl}}'}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
