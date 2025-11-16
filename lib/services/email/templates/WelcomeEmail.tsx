import * as React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface WelcomeEmailProps {
  name: string;
  email: string;
  organizationName: string;
  projectName: string;
  temporaryPassword: string;
  dashboardUrl: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export function WelcomeEmail({
  name,
  email,
  organizationName,
  projectName,
  temporaryPassword,
  dashboardUrl,
  branding,
}: WelcomeEmailProps) {
  const bodyContent = `
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      Hi ${name},
    </p>
    
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      Welcome to <strong>${organizationName}</strong>${projectName ? ` for the <strong>${projectName}</strong> project` : ''}! Your account has been successfully created and you're ready to start tracking your content performance.
    </p>
    
          <div style="background: #f8f5e6; border-left: 4px solid #d4a574; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #8b6914; font-size: 16px; font-weight: 600;">🔑 Your Login Credentials</h3>
        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-family: monospace; color: #333;">${temporaryPassword}</code></p>
    
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
