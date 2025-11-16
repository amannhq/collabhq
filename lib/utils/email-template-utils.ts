/**
 * Email Template Utilities
 * 
 * Helper functions for managing email templates
 */

import { EmailTemplate } from '@/lib/db/models';
import { createLogger } from '@/lib/utils/logger';
import connectDB from '@/lib/db/mongodb';

const logger = createLogger('email-template-utils');

interface DefaultTemplateConfig {
  slug: string;
  category: 'transactional' | 'marketing' | 'notification';
  name: string;
  subject: string;
  previewText: string;
  content: {
    heading: string;
    body: string;
    ctaText: string;
    ctaUrl: string;
    footerText: string;
  };
  variables: Array<{
    key: string;
    label: string;
    description: string;
    required: boolean;
    example: string;
  }>;
  isActive: boolean;
  isDefault: boolean;
}

const DEFAULT_TEMPLATES: DefaultTemplateConfig[] = [
  {
    slug: 'invitation',
    category: 'transactional',
    name: 'Creator Invitation',
    subject: "You're invited to join {{projectName}} at {{organizationName}}",
    previewText: 'Accept your invitation to start contributing',
    content: {
      heading: "You've Been Invited! 🎉",
      body: `<p>Hi {{name}},</p>
<p>You've been invited to join <strong>{{projectName}}</strong> at {{organizationName}}.</p>
<p>As a creator, you'll be able to submit posts, track your performance, and collaborate with the team.</p>
<p>Click the button below to accept your invitation and get started:</p>`,
      ctaText: 'Accept Invitation',
      ctaUrl: '{{inviteUrl}}',
      footerText: "If you didn't expect this invitation, you can safely ignore this email.",
    },
    variables: [
      { key: 'name', label: 'Creator Name', description: 'The name of the invited creator', required: true, example: 'John Doe' },
      { key: 'email', label: 'Email Address', description: 'The email address of the creator', required: true, example: 'john@example.com' },
      { key: 'organizationName', label: 'Organization Name', description: 'The name of the organization', required: true, example: 'Acme Corp' },
      { key: 'projectName', label: 'Project Name', description: 'The name of the project', required: true, example: 'Marketing Campaign' },
      { key: 'inviteUrl', label: 'Invitation URL', description: 'The unique invitation link', required: true, example: 'https://app.com/invite/abc123' },
    ],
    isActive: true,
    isDefault: true,
  },
  {
    slug: 'welcome',
    category: 'transactional',
    name: 'Welcome Email',
    subject: 'Welcome to {{organizationName}}! 🚀',
    previewText: "You're all set! Let's get started",
    content: {
      heading: 'Welcome Aboard! 🎊',
      body: `<p>Hi {{name}},</p>
<p>Welcome to {{organizationName}}! We're thrilled to have you on our team.</p>
<p>Your creator account has been successfully activated. You can now:</p>
<ul>
  <li>Submit posts for review</li>
  <li>Track your performance metrics</li>
  <li>View your earnings and analytics</li>
  <li>Collaborate with the team</li>
</ul>
<p>Click the button below to access your dashboard and get started:</p>`,
      ctaText: 'Go to Dashboard',
      ctaUrl: '{{dashboardUrl}}',
      footerText: 'Need help getting started? Feel free to reach out to your team admin.',
    },
    variables: [
      { key: 'name', label: 'Creator Name', description: 'The name of the creator', required: true, example: 'John Doe' },
      { key: 'email', label: 'Email Address', description: 'The email address of the creator', required: true, example: 'john@example.com' },
      { key: 'organizationName', label: 'Organization Name', description: 'The name of the organization', required: true, example: 'Acme Corp' },
      { key: 'dashboardUrl', label: 'Dashboard URL', description: 'The URL to the creator dashboard', required: true, example: 'https://app.com/dashboard' },
    ],
    isActive: true,
    isDefault: true,
  },
  {
    slug: 'reminder',
    category: 'notification',
    name: 'Post Submission Reminder',
    subject: 'Reminder: Pending posts at {{organizationName}}',
    previewText: "Don't forget to submit your posts",
    content: {
      heading: 'Friendly Reminder 📝',
      body: `<p>Hi {{name}},</p>
<p>This is a friendly reminder that you have pending posts waiting for submission at {{organizationName}}.</p>
<p>Your contributions are important to us, and we'd love to see your latest work!</p>
<p>Click the button below to log in to your dashboard and submit your posts:</p>`,
      ctaText: 'Submit Posts',
      ctaUrl: '{{dashboardUrl}}',
      footerText: 'You can adjust your notification preferences in your account settings.',
    },
    variables: [
      { key: 'name', label: 'Creator Name', description: 'The name of the creator', required: true, example: 'John Doe' },
      { key: 'email', label: 'Email Address', description: 'The email address of the creator', required: true, example: 'john@example.com' },
      { key: 'organizationName', label: 'Organization Name', description: 'The name of the organization', required: true, example: 'Acme Corp' },
      { key: 'dashboardUrl', label: 'Dashboard URL', description: 'The URL to the creator dashboard', required: true, example: 'https://app.com/dashboard' },
    ],
    isActive: true,
    isDefault: true,
  },
];

/**
 * Initialize default email templates for a new organization
 * 
 * @param organizationId - The organization ID to create templates for
 * @param branding - Optional branding configuration
 * @returns Array of created template IDs
 */
export async function initializeDefaultTemplates(
  organizationId: string,
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  }
): Promise<string[]> {
  try {
    // Ensure database connection
    await connectDB();
    
    logger.info({ organizationId }, 'Initializing default email templates');

    const createdTemplates: string[] = [];

    for (const template of DEFAULT_TEMPLATES) {
      // Check if template already exists
      const existing = await EmailTemplate.findOne({
        organizationId,
        slug: template.slug,
      });

      if (existing) {
        logger.info(
          { organizationId, slug: template.slug },
          'Template already exists, skipping'
        );
        continue;
      }

      // Create template
      const newTemplate = new EmailTemplate({
        organizationId,
        ...template,
        branding: {
          primaryColor: branding?.primaryColor || '#667eea',
          secondaryColor: branding?.secondaryColor || '#764ba2',
          logoUrl: branding?.logoUrl || undefined,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      });

      await newTemplate.save();
      createdTemplates.push(newTemplate._id.toString());

      logger.info(
        { organizationId, slug: template.slug, templateId: newTemplate._id },
        'Created default template'
      );
    }

    logger.info(
      { organizationId, count: createdTemplates.length },
      'Finished initializing default templates'
    );

    return createdTemplates;
  } catch (error) {
    logger.error(
      { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        organizationId 
      }, 
      'Failed to initialize default templates'
    );
    throw error;
  }
}

/**
 * Get default template configuration by slug
 * 
 * @param slug - Template slug (invitation, welcome, reminder)
 * @returns Template configuration or undefined
 */
export function getDefaultTemplateConfig(slug: string): DefaultTemplateConfig | undefined {
  return DEFAULT_TEMPLATES.find((t) => t.slug === slug);
}

/**
 * Get all default template configurations
 * 
 * @returns Array of all default template configurations
 */
export function getAllDefaultTemplateConfigs(): DefaultTemplateConfig[] {
  return DEFAULT_TEMPLATES;
}
