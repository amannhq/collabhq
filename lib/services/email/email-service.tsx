import * as React from 'react';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createLogger } from '@/lib/utils/logger';
import { InvitationEmail } from './templates/InvitationEmail';
import { WelcomeEmail } from './templates/WelcomeEmail';
import { ReminderEmail } from './templates/ReminderEmail';
import { BaseEmailTemplate } from './templates/BaseEmailTemplate';
import { OTPEmail } from './templates/OTPEmail';
import { ensureDbConnection } from '@/lib/db/mongodb';
import { EmailTemplate, Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import {
  shouldUseResendTemplates,
  getTemplateId,
  isTemplateConfigured,
  type ResendTemplateType,
} from './resend-templates';

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

interface SendTemplateEmailParams {
  to: string;
  templateType: ResendTemplateType;
  templateData: Record<string, string | number | boolean>;
  from?: string;
}

/**
 * Send email using Resend API with React components
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
 * Send email using Resend template ID
 */
async function sendTemplateEmail({
  to,
  templateType,
  templateData,
  from,
}: SendTemplateEmailParams) {
  try {
    const fromAddress = from || DEFAULT_FROM_EMAIL;

    if (!resend) {
      logger.warn({}, 'Resend API key not configured, template email will only be logged');
      console.log('\n📧 TEMPLATE EMAIL DEBUG (Development Mode):');
      console.log(`From: ${fromAddress}`);
      console.log(`To: ${to}`);
      console.log(`Template Type: ${templateType}`);
      console.log(`Template Data:`, templateData);
      console.log('─'.repeat(80) + '\n');
      return { success: true, id: 'dev-mode' };
    }

    const templateId = getTemplateId(templateType);
    if (!templateId) {
      throw new Error(`Template ID not configured for type: ${templateType}`);
    }

    // Send email via Resend with template
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      // @ts-expect-error - Resend types may not include template fields yet
      template_id: templateId,
      template_data: templateData,
    });

    if (error) {
      logger.error({ error, to, templateType }, 'Failed to send template email via Resend');
      throw error;
    }

    logger.info(
      {
        to,
        templateType,
        templateId,
        emailId: data?.id,
      },
      'Template email sent successfully'
    );

    return { success: true, id: data?.id };
  } catch (error) {
    logger.error({ error, to, templateType }, 'Failed to send template email');
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

  // Check if we should use Resend templates
  if (shouldUseResendTemplates()) {
    // Choose template based on whether message is provided
    const templateType = message ? 'invitation-with-message' : 'invitation';

    if (isTemplateConfigured(templateType)) {
      return sendTemplateEmail({
        to: email,
        templateType,
        templateData: {
          name,
          organizationName,
          projectName,
          inviteUrl,
          ...(message && { message }),
        },
      });
    }
  }

  // Fall back to React Email components
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
  // Check if we should use Resend templates
  if (shouldUseResendTemplates() && isTemplateConfigured('welcome')) {
    return sendTemplateEmail({
      to: email,
      templateType: 'welcome',
      templateData: {
        name,
        email,
        organizationName,
        projectName: projectName || '',
        temporaryPassword: temporaryPassword || '',
        dashboardUrl,
      },
    });
  }

  // Fall back to React Email components
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
  // Check if we should use Resend templates
  if (shouldUseResendTemplates() && isTemplateConfigured('reminder')) {
    return sendTemplateEmail({
      to: email,
      templateType: 'reminder',
      templateData: {
        name,
        organizationName,
        dashboardUrl,
        pendingPostsCount: posts.length,
      },
    });
  }

  // Fall back to React Email components
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

/**
 * Send OTP email for authentication
 */
export async function sendOTPEmail({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: 'email-verification' | 'sign-in' | 'forget-password';
}) {
  const subjects = {
    'email-verification': 'Verify Your Email - Collab',
    'sign-in': 'Sign In Code - Collab',
    'forget-password': 'Reset Your Password - Collab',
  };

  const titles = {
    'email-verification': 'Verify Your Email',
    'sign-in': 'Sign In to Your Account',
    'forget-password': 'Reset Your Password',
  };

  const descriptions = {
    'email-verification':
      'Thank you for signing up! Use the verification code below to complete your registration and start managing your creator partnerships.',
    'sign-in':
      'Use the code below to securely sign in to your account. This code will expire in 5 minutes.',
    'forget-password':
      'You requested to reset your password. Use the code below to create a new password for your account.',
  };

  // Check if we should use Resend templates
  if (shouldUseResendTemplates() && isTemplateConfigured('otp')) {
    return sendTemplateEmail({
      to: email,
      templateType: 'otp',
      templateData: {
        otp,
        title: titles[type],
        description: descriptions[type],
      },
    });
  }

  // Fall back to React Email component
  const emailComponent = <OTPEmail otp={otp} type={type} />;

  return sendEmail({
    to: email,
    subject: subjects[type],
    react: emailComponent,
  });
}
