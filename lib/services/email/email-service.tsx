import * as React from 'react';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createLogger } from '@/lib/utils/logger';
import { InvitationEmail } from './templates/InvitationEmail';
import { WelcomeEmail } from './templates/WelcomeEmail';
import { ReminderEmail } from './templates/ReminderEmail';
import { BaseEmailTemplate } from './templates/BaseEmailTemplate';
import { ensureDbConnection } from '@/lib/db/mongodb';
import { EmailTemplate, Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';

const logger = createLogger('email-service');

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@collab.so';
const TEMPLATE_CACHE_TTL_MS =
  Number(process.env.EMAIL_TEMPLATE_CACHE_TTL_MS) || 5 * 60 * 1000; // 5 minutes

type BrandingConfig = {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  fontFamily: string;
};

const DEFAULT_BRANDING: BrandingConfig = {
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  logoUrl: undefined,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

interface TemplateBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  fontFamily?: string;
}

interface TemplateContent {
  heading?: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footerText?: string;
}

interface CachedTemplateResult {
  template: {
    _id: string;
    branding?: TemplateBranding;
    subject: string;
    previewText?: string;
    content: TemplateContent;
  } | null;
  branding: BrandingConfig;
  organization: Pick<IOrganization, 'settings'> | null;
}

const templateCache = new Map<string, { expiresAt: number; value: CachedTemplateResult }>();
const templateFetchPromises = new Map<string, Promise<CachedTemplateResult>>();

const buildTemplateCacheKey = (organizationId: string, templateSlug: string) =>
  `${organizationId}:${templateSlug}`;

function resolveBranding(
  organization: Pick<IOrganization, 'settings'> | null,
  templateBranding?: TemplateBranding
): BrandingConfig {
  if (templateBranding) {
    return {
      primaryColor: templateBranding.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: templateBranding.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      logoUrl: templateBranding.logoUrl || DEFAULT_BRANDING.logoUrl,
      fontFamily: templateBranding.fontFamily || DEFAULT_BRANDING.fontFamily,
    };
  }

  return {
    primaryColor: organization?.settings?.primaryColor || DEFAULT_BRANDING.primaryColor,
    secondaryColor: organization?.settings?.secondaryColor || DEFAULT_BRANDING.secondaryColor,
    logoUrl: organization?.settings?.logo || DEFAULT_BRANDING.logoUrl,
    fontFamily: DEFAULT_BRANDING.fontFamily,
  };
}

function setTemplateCache(key: string, value: CachedTemplateResult) {
  templateCache.set(key, {
    expiresAt: Date.now() + TEMPLATE_CACHE_TTL_MS,
    value,
  });
}

function getTemplateCache(key: string): CachedTemplateResult | null {
  const cached = templateCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (cached) {
    templateCache.delete(key);
  }
  return null;
}

async function trackTemplateUsage(templateId: string) {
  try {
    await EmailTemplate.findByIdAndUpdate(templateId, {
      $inc: { usageCount: 1 },
      lastUsedAt: new Date(),
    });
  } catch (error) {
    logger.warn({ error, templateId }, 'Failed to track template usage');
  }
}

interface SendEmailParams {
  to: string;
  subject: string;
  react: React.ReactElement;
  from?: string;
}

/**
 * Send email using Resend API
 */
export async function sendEmail({ to, subject, react, from }: SendEmailParams) {
  try {
    const fromAddress = from || DEFAULT_FROM_EMAIL;

    // Check if Resend is configured
    if (!resend) {
      logger.warn({}, 'Resend API key not configured, email will only be logged');
      
      // Render to HTML for preview
      const html = await render(react);
      
      console.log('\n📧 EMAIL DEBUG (Development Mode):');
      console.log(`From: ${fromAddress}`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Preview: ${html.substring(0, 200)}...`);
      console.log('─'.repeat(80) + '\n');
      
      return { success: true, id: 'dev-mode' };
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      react,
    });

    if (error) {
      logger.error({ error, to, subject }, 'Failed to send email via Resend');
      throw error;
    }

    logger.info(
      {
        to,
        subject,
        emailId: data?.id,
      },
      'Email sent successfully'
    );

    return { success: true, id: data?.id };
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to send email');
    throw error;
  }
}

/**
 * Get email template with organization branding
 */
async function getTemplateWithBranding(
  organizationId: string,
  templateSlug: string
) {
  const cacheKey = buildTemplateCacheKey(organizationId, templateSlug);
  const cached = getTemplateCache(cacheKey);
  if (cached) {
    return cached;
  }

  if (templateFetchPromises.has(cacheKey)) {
    return templateFetchPromises.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    try {
      await ensureDbConnection();

      const organization = await Organization.findById(organizationId)
        .select('settings')
        .lean<Pick<IOrganization, 'settings'> | null>();

      const customTemplate = await EmailTemplate.findOne({
        organizationId,
        templateSlug,
        isActive: true,
      })
        .select('branding subject previewText content')
        .lean<{
          _id: string;
          branding?: TemplateBranding;
          subject: string;
          previewText?: string;
          content: TemplateContent;
        } | null>();

      const template = customTemplate
        ? {
            _id: customTemplate._id.toString(),
            branding: customTemplate.branding,
            subject: customTemplate.subject,
            previewText: customTemplate.previewText,
            content: customTemplate.content,
          }
        : null;

      const branding = resolveBranding(organization, template?.branding);

      const result: CachedTemplateResult = {
        template,
        branding,
        organization,
      };

      setTemplateCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error({ error, organizationId, templateSlug }, 'Error getting template');
      return {
        template: null,
        branding: DEFAULT_BRANDING,
        organization: null,
      };
    }
  })().finally(() => {
    templateFetchPromises.delete(cacheKey);
  });

  templateFetchPromises.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Replace template variables in content
 */
function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Send invitation email to creator
 */
export async function sendInvitationEmail({
  email,
  name,
  token,
  organizationId,
  organizationName,
  projectName,
  message,
}: {
  email: string;
  name: string;
  token: string;
  organizationId: string;
  organizationName: string;
  projectName: string;
  message?: string;
}) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;
  
  // Get template with branding
  const { template, branding } = await getTemplateWithBranding(
    organizationId,
    'invitation'
  );

  let emailComponent;
  let subject = `Invitation to join ${organizationName}`;

  if (template) {
    // Use custom template with variable replacement
    const variables = {
      name,
      organizationName,
      projectName,
      inviteUrl,
      message: message || '',
    };

    const bodyContent = replaceVariables(template.content.body, variables);
    subject = replaceVariables(template.subject, variables);
    const heading = template.content.heading
      ? replaceVariables(template.content.heading, variables)
      : "You're Invited! 🎉";

    emailComponent = (
      <BaseEmailTemplate
        branding={template.branding ?? branding}
        content={{
          heading,
          body: bodyContent,
          ctaText: template.content.ctaText || 'Accept Invitation',
          ctaUrl: inviteUrl,
          footerText: template.content.footerText,
        }}
        previewText={template.previewText}
      />
    );

    void trackTemplateUsage(template._id);
  } else {
    // Use default template
    emailComponent = (
      <InvitationEmail
        name={name}
        organizationName={organizationName}
        projectName={projectName}
        inviteUrl={inviteUrl}
        message={message}
        branding={branding}
      />
    );
  }

  return sendEmail({
    to: email,
    subject,
    react: emailComponent,
  });
}

/**
 * Send welcome email to activated creator
 */
export async function sendWelcomeEmail({
  email,
  name,
  organizationId,
  organizationName,
  projectName,
  temporaryPassword,
  dashboardUrl,
}: {
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  projectName?: string;
  temporaryPassword?: string;
  dashboardUrl: string;
}) {
  // Get template with branding
  const { template, branding } = await getTemplateWithBranding(
    organizationId,
    'welcome'
  );

  let emailComponent;
  let subject = `Welcome to ${organizationName}!`;

  if (template) {
    // Use custom template with variable replacement
    const variables = {
      name,
      organizationName,
      projectName: projectName || '',
      temporaryPassword: temporaryPassword || '',
      dashboardUrl,
    };

    const bodyContent = replaceVariables(template.content.body, variables);
    subject = replaceVariables(template.subject, variables);
    const heading = template.content.heading
      ? replaceVariables(template.content.heading, variables)
      : 'Welcome Aboard! 🚀';

    emailComponent = (
      <BaseEmailTemplate
        branding={template.branding ?? branding}
        content={{
          heading,
          body: bodyContent,
          ctaText: template.content.ctaText || 'Go to Dashboard',
          ctaUrl: dashboardUrl,
          footerText: template.content.footerText,
        }}
        previewText={template.previewText}
      />
    );

    void trackTemplateUsage(template._id);
  } else {
    // Use default template
    emailComponent = (
      <WelcomeEmail
        name={name}
        email={email}
        organizationName={organizationName}
        projectName={projectName || ''}
        temporaryPassword={temporaryPassword || 'temp-password'}
        dashboardUrl={dashboardUrl}
        branding={branding}
      />
    );
  }

  return sendEmail({
    to: email,
    subject,
    react: emailComponent,
  });
}

interface MetricsReminderEmailPost {
  projectName?: string;
  postUrl: string;
  lastMetricsUpdate?: Date | string;
}

interface MetricsReminderEmailParams {
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  dashboardUrl: string;
  posts: MetricsReminderEmailPost[];
}

export async function sendMetricsReminderEmail({
  email,
  name,
  organizationId,
  organizationName,
  dashboardUrl,
  posts,
}: MetricsReminderEmailParams) {
  const { template, branding } = await getTemplateWithBranding(
    organizationId,
    'reminder'
  );

  let emailComponent;
  let subject = `Reminder: Update your metrics for ${organizationName}`;

  const variables = {
    name,
    organizationName,
    dashboardUrl,
    pendingPostsCount: posts.length.toString(),
  };

  if (template) {
    const bodyContent = replaceVariables(template.content.body, variables);
    subject = replaceVariables(template.subject, variables);
    const heading = template.content.heading
      ? replaceVariables(template.content.heading, variables)
      : 'Friendly Reminder 📝';

    emailComponent = (
      <BaseEmailTemplate
        branding={template.branding ?? branding}
        content={{
          heading,
          body: bodyContent,
          ctaText: template.content.ctaText || 'Update Metrics',
          ctaUrl: template.content.ctaUrl
            ? replaceVariables(template.content.ctaUrl, variables)
            : dashboardUrl,
          footerText: template.content.footerText,
        }}
        previewText={template.previewText}
      />
    );

    void trackTemplateUsage(template._id);
  } else {
    emailComponent = (
      <ReminderEmail
        name={name}
        organizationName={organizationName}
        dashboardUrl={dashboardUrl}
        posts={posts}
        branding={branding}
      />
    );
  }

  return sendEmail({
    to: email,
    subject,
    react: emailComponent,
  });
}
