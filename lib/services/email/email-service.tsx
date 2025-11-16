import * as React from 'react';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createLogger } from '@/lib/utils/logger';
import { InvitationEmail } from './templates/InvitationEmail';
import { WelcomeEmail } from './templates/WelcomeEmail';
import { BaseEmailTemplate } from './templates/BaseEmailTemplate';
import connectDB from '@/lib/db/mongodb';
import { EmailTemplate, Organization } from '@/lib/db/models';

const logger = createLogger('email-service');

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
    // Check if Resend is configured
    if (!resend) {
      logger.warn({}, 'Resend API key not configured, email will only be logged');
      
      // Render to HTML for preview
      const html = await render(react);
      
      console.log('\n📧 EMAIL DEBUG (Development Mode):');
      console.log(`From: ${from || process.env.RESEND_FROM_EMAIL || 'noreply@yourapp.com'}`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Preview: ${html.substring(0, 200)}...`);
      console.log('─'.repeat(80) + '\n');
      
      return { success: true, id: 'dev-mode' };
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
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
  try {
    await connectDB();

    // Get organization for default branding
    const organization = await Organization.findById(organizationId).lean() as {
      settings?: {
        primaryColor?: string;
        secondaryColor?: string;
        logo?: string;
      };
    } | null;
    
    // Try to get custom template
    const customTemplate = await EmailTemplate.findOne({
      organizationId,
      templateSlug,
      isActive: true,
    }).lean() as {
      _id: { toString(): string };
      branding?: {
        primaryColor?: string;
        secondaryColor?: string;
        logoUrl?: string;
        fontFamily?: string;
      };
      subject: string;
      previewText?: string;
      content: {
        heading?: string;
        body: string;
        ctaText?: string;
        ctaUrl?: string;
        footerText?: string;
      };
    } | null;

    // Use custom template if exists, otherwise use organization branding or defaults
    const branding = customTemplate?.branding || {
      primaryColor: organization?.settings?.primaryColor || '#667eea',
      secondaryColor: organization?.settings?.secondaryColor || '#764ba2',
      logoUrl: organization?.settings?.logo || undefined,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    };

    return {
      template: customTemplate,
      branding,
      organization,
    };
  } catch (error) {
    logger.error({ error, organizationId, templateSlug }, 'Error getting template');
    return {
      template: null,
      branding: {
        primaryColor: '#667eea',
        secondaryColor: '#764ba2',
        logoUrl: undefined,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      },
      organization: null,
    };
  }
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
        branding={template.branding}
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

    // Update template usage
    await EmailTemplate.findByIdAndUpdate(template._id, {
      $inc: { usageCount: 1 },
      lastUsedAt: new Date(),
    });
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
        branding={template.branding}
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

    // Update template usage
    await EmailTemplate.findByIdAndUpdate(template._id, {
      $inc: { usageCount: 1 },
      lastUsedAt: new Date(),
    });
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
