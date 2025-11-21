import * as React from 'react';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createLogger } from '@/lib/utils/logger';
import { InvitationEmail } from './templates/InvitationEmail';
import { InvitationWithMessageEmail } from './templates/InvitationWithMessageEmail';
import { WelcomeEmail } from './templates/WelcomeEmail';
import { OTPEmail } from './templates/OTPEmail';
import { ReminderEmail } from './templates/ReminderEmail';
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
 * Note: Resend's API-based templates are not yet fully supported.
 * This will throw an error and calling functions should fall back to React Email.
 */
async function sendTemplateEmail({
  to,
  templateType,
  templateData,
  from,
}: SendTemplateEmailParams) {
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

  // IMPORTANT: Resend's template API is not yet fully supported
  // The API returns "Missing `html` or `text` field" error when using template_id
  // Throw an error to force fallback to React Email components
  throw new Error(
    'Resend dashboard templates via API are not yet supported. ' +
    'Please use React Email components or disable USE_RESEND_TEMPLATES in your .env file.'
  );
}

/**
 * Send invitation email to creator
 */
export async function sendInvitationEmail({
  email,
  name,
  token,
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
      try {
        return await sendTemplateEmail({
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
      } catch (templateError) {
        // Log the template error and fall back to React Email components
        logger.warn(
          { error: templateError, templateType },
          'Failed to send with Resend template, falling back to React Email'
        );
        // Continue to fallback below
      }
    }
  }

  // Use new TSX email templates that match the HTML design
  let emailComponent;
  const subject = `Invitation to join ${organizationName}`;

  // Use the new templates based on whether message is provided
  if (message) {
    emailComponent = (
      <InvitationWithMessageEmail
        name={name}
        organizationName={organizationName}
        projectName={projectName}
        inviteUrl={inviteUrl}
        message={message}
      />
    );
  } else {
    emailComponent = (
      <InvitationEmail
        name={name}
        organizationName={organizationName}
        projectName={projectName}
        inviteUrl={inviteUrl}
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

  // Use new TSX email template that matches the HTML design
  const subject = `Welcome to ${organizationName}!`;

  const emailComponent = (
    <WelcomeEmail
      name={name}
      email={email}
      organizationName={organizationName}
      projectName={projectName || ''}
      temporaryPassword={temporaryPassword || 'temp-password'}
      dashboardUrl={dashboardUrl}
    />
  );

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

  // Use new TSX email template that matches the HTML design
  const subject = `Reminder: Update your metrics for ${organizationName}`;

  const emailComponent = (
    <ReminderEmail
      name={name}
      organizationName={organizationName}
      dashboardUrl={dashboardUrl}
      pendingPostsCount={posts.length}
    />
  );

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

  // Use new TSX email template that matches the HTML design
  const emailComponent = (
    <OTPEmail
      otp={otp}
      title={titles[type]}
      description={descriptions[type]}
    />
  );

  return sendEmail({
    to: email,
    subject: subjects[type],
    react: emailComponent,
  });
}
