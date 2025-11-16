import * as React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface WelcomeEmailProps {
  name: string;
  organizationName: string;
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
  dashboardUrl,
  branding,
}: WelcomeEmailProps) => {
  const bodyContent = `
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      Hi ${name},
    </p>
    
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      Welcome to <strong>${organizationName}</strong>! Your account has been successfully activated.
    </p>
    
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #333;">
      You can now start submitting your posts and tracking their performance.
    </p>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="font-weight: 600; margin: 0 0 8px 0; color: #065f46;">Getting Started Tips:</p>
      <ul style="margin: 0; padding-left: 20px; color: #047857;">
        <li style="margin: 8px 0;">Log in to your dashboard to submit your first post</li>
        <li style="margin: 8px 0;">Connect your social media accounts</li>
        <li style="margin: 8px 0;">Track your post performance in real-time</li>
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
