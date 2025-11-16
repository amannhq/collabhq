import * as React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface InvitationEmailProps {
  name: string;
  organizationName: string;
  projectName: string;
  inviteUrl: string;
  message?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    fontFamily?: string;
  };
}

export const InvitationEmail = ({
  name,
  organizationName,
  projectName,
  inviteUrl,
  message,
  branding,
}: InvitationEmailProps) => {
  const bodyContent = `
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      Hi ${name},
    </p>
    
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      <strong>${organizationName}</strong> has invited you to join their team as a content creator
      for the <strong>${projectName}</strong> project.
    </p>
    
    ${
      message
        ? `
      <div style="background: #f9fafb; border-left: 4px solid ${branding?.primaryColor || '#667eea'}; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="font-weight: 600; margin: 0 0 8px 0; color: #333;">Message from the team:</p>
        <p style="margin: 0; color: #666;">${message}</p>
      </div>
    `
        : ''
    }
    
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      Click the button below to accept your invitation and set up your account.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      This invitation will expire in 7 days.
    </p>
  `;

  return (
    <BaseEmailTemplate
      branding={branding}
      content={{
        heading: "You're Invited! 🎉",
        body: bodyContent,
        ctaText: 'Accept Invitation',
        ctaUrl: inviteUrl,
        footerText:
          "If you didn't expect this invitation, you can safely ignore this email.",
      }}
      previewText={`${organizationName} has invited you to join their team`}
    />
  );
};

export default InvitationEmail;
