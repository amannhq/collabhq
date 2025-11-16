import * as React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface WelcomeEmailProps {
  name: string;
  organizationName: string;
  projectName?: string;
  temporaryPassword: string;
  dashboardUrl: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    fontFamily?: string;
  };
}

export const WelcomeEmail = ({
  name,
  organizationName,
  projectName,
  temporaryPassword,
  dashboardUrl,
  branding,
}: WelcomeEmailProps) => {
  const bodyContent = `
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      Hi ${name},
    </p>
    
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      Welcome to <strong>${organizationName}</strong>${projectName ? ` for the <strong>${projectName}</strong> project` : ''}! Your account has been successfully created and you're ready to start tracking your content performance.
    </p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <p style="font-weight: 600; margin: 0 0 12px 0; color: #92400e; font-size: 16px;">🔑 Your Login Credentials</p>
      <div style="background: white; padding: 16px; border-radius: 6px; margin-top: 12px;">
        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Email:</strong> ${name}</p>
        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #1f2937;">${temporaryPassword}</code></p>
      </div>
      <p style="margin: 12px 0 0 0; color: #92400e; font-size: 13px;">⚠️ Please change your password after your first login for security.</p>
    </div>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="font-weight: 600; margin: 0 0 8px 0; color: #065f46;">What's Next?</p>
      <ul style="margin: 0; padding-left: 20px; color: #047857;">
        <li style="margin: 8px 0;">Log in with your credentials and change your password</li>
        <li style="margin: 8px 0;">Complete your profile setup</li>
        <li style="margin: 8px 0;">Start submitting your posts for tracking</li>
        <li style="margin: 8px 0;">Monitor your performance with real-time analytics</li>
      </ul>
    </div>
    
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      If you have any questions, feel free to reach out to your team administrator.
    </p>
    
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      Happy creating! 🎨
    </p>
  `;

  return (
    <BaseEmailTemplate
      branding={branding}
      content={{
        heading: 'Welcome Aboard! 🚀',
        body: bodyContent,
        ctaText: 'Go to Dashboard',
        ctaUrl: dashboardUrl,
      }}
      previewText={`Welcome to ${organizationName}! Get started now.`}
    />
  );
};

export default WelcomeEmail;
