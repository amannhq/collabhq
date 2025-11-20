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
  email,
  organizationName,
  projectName,
  temporaryPassword,
  dashboardUrl,
  branding,
}: WelcomeEmailProps) {
  const bodyContent = `
    <div style="margin-bottom: 32px;">
      <h2 style="font-size: 32px; font-weight: 600; margin: 0 0 12px 0; color: #000000; line-height: 1.2; letter-spacing: -0.5px;">
        Welcome to ${organizationName}
      </h2>
      <p style="font-size: 16px; line-height: 1.6; margin: 0; color: rgba(0, 0, 0, 0.7);">
        Your account has been created${projectName ? ` for the <strong style="color: #000000;">${projectName}</strong> project` : ''}.
      </p>
    </div>
    
    <div style="background: #000000; border-radius: 16px; padding: 40px; margin: 32px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 56px; height: 56px; background: rgba(255, 255, 255, 0.1); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h3 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.5px;">Your Login Credentials</h3>
        <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 14px;">Use these to access your creator dashboard</p>
      </div>
      
      <div style="background: #ffffff; border-radius: 12px; padding: 28px; margin-top: 24px;">
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <p style="margin: 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: rgba(0, 0, 0, 0.5);">Email Address</p>
          </div>
          <div style="background: #f3f1ea; border: 2px solid rgba(0, 0, 0, 0.1); border-radius: 10px; padding: 16px;">
            <p style="margin: 0; font-size: 16px; color: #000000; font-weight: 600; word-break: break-all;">${email}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <p style="margin: 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: rgba(0, 0, 0, 0.5);">Temporary Password</p>
          </div>
          <div style="background: #f3f1ea; border: 2px solid #000000; border-radius: 10px; padding: 20px; text-align: center;">
            <p style="margin: 0; font-family: 'JetBrains Mono', 'Courier New', 'Courier', monospace; font-size: 20px; color: #000000; font-weight: 700; letter-spacing: 3px; word-break: break-all;">${temporaryPassword}</p>
          </div>
        </div>
        
        <div style="background: #f3f1ea; border-left: 4px solid #000000; border-radius: 10px; padding: 18px;">
          <div style="display: flex; align-items: start;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px; flex-shrink: 0; margin-top: 2px;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <p style="margin: 0 0 6px 0; font-size: 14px; color: #000000; font-weight: 600;">Security Notice</p>
              <p style="margin: 0; font-size: 13px; color: rgba(0, 0, 0, 0.7); line-height: 1.6;">
                This is a temporary password. You'll be required to create a new secure password when you first log in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div style="background: #f3f1ea; border: 2px solid rgba(0, 0, 0, 0.1); border-radius: 12px; padding: 32px; margin: 32px 0;">
      <h3 style="margin: 0 0 24px 0; color: #000000; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        Next Steps
      </h3>
      <div style="display: grid; gap: 16px;">
        <div style="display: flex; align-items: flex-start; background: white; padding: 18px; border-radius: 10px; border-left: 4px solid #000000; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
          <span style="flex-shrink: 0; width: 32px; height: 32px; background: #000000; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; margin-right: 16px;">1</span>
          <div>
            <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: #000000; line-height: 1.4;">Click the button below to access the creator login page</p>
            <p style="margin: 0; font-size: 13px; color: rgba(0, 0, 0, 0.6); line-height: 1.5;">Use your email and temporary password from above</p>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start; background: white; padding: 18px; border-radius: 10px; border-left: 4px solid rgba(0, 0, 0, 0.7); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
          <span style="flex-shrink: 0; width: 32px; height: 32px; background: rgba(0, 0, 0, 0.7); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; margin-right: 16px;">2</span>
          <div>
            <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: #000000; line-height: 1.4;">Create your new secure password</p>
            <p style="margin: 0; font-size: 13px; color: rgba(0, 0, 0, 0.6); line-height: 1.5;">You'll be prompted to set a permanent password immediately</p>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start; background: white; padding: 18px; border-radius: 10px; border-left: 4px solid rgba(0, 0, 0, 0.5); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
          <span style="flex-shrink: 0; width: 32px; height: 32px; background: rgba(0, 0, 0, 0.5); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; margin-right: 16px;">3</span>
          <div>
            <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: #000000; line-height: 1.4;">Start tracking your posts</p>
            <p style="margin: 0; font-size: 13px; color: rgba(0, 0, 0, 0.6); line-height: 1.5;">Submit your content and monitor performance analytics</p>
          </div>
        </div>
      </div>
    </div>
    
    <div style="margin: 32px 0; padding: 20px; background: white; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 10px;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: rgba(0, 0, 0, 0.6);">
        Questions? Contact your team administrator or reply to this email for support.
      </p>
    </div>
  `;

  return (
    <BaseEmailTemplate
      branding={branding}
      content={{
        heading: '',
        body: bodyContent,
        ctaText: 'Access Your Dashboard',
        ctaUrl: dashboardUrl,
      }}
      previewText={`Welcome to ${organizationName} - Get started now`}
    />
  );
};

export default WelcomeEmail;
