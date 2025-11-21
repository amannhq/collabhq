import * as React from 'react';
import { Html, Head, Body, Container, Text, Link, Heading } from '@react-email/components';

interface WelcomeEmailNewProps {
  name: string;
  email: string;
  organizationName: string;
  projectName: string;
  temporaryPassword: string;
  dashboardUrl: string;
}

export function WelcomeEmail({
  name,
  email,
  organizationName,
  projectName,
  temporaryPassword,
  dashboardUrl,
}: WelcomeEmailNewProps) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>Welcome to {organizationName}</title>
        <style dangerouslySetInnerHTML={{ __html: emailStyles }} />
      </Head>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <div style={headerDarkStyle}>
            <Heading style={headerH1DarkStyle}>Welcome to {organizationName}</Heading>
          </div>

          {/* Content */}
          <div style={contentStyle}>
            <Text style={paragraphStyle}>
              Hi <strong style={strongStyle}>{name}</strong>,
            </Text>

            <Text style={paragraphStyle}>
              Your account has been created for the <strong style={strongStyle}>{projectName}</strong> project.
            </Text>

            {/* Credentials Box */}
            <div style={credentialsBoxStyle}>
              <div style={credentialsHeaderStyle}>
                Your Login Credentials
              </div>

              {/* Email Credential */}
              <div style={credentialItemStyle}>
                <div style={credentialLabelStyle}>EMAIL ADDRESS</div>
                <div style={credentialValueStyle}>{email}</div>
              </div>

              {/* Password Credential */}
              <div style={credentialItemStyle}>
                <div style={credentialLabelStyle}>TEMPORARY PASSWORD</div>
                <div style={passwordContainerStyle}>
                  <div style={passwordValueStyle}>{temporaryPassword}</div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div style={securityNoticeStyle}>
              <Text style={securityNoticeTextStyle}>
                <strong>Important:</strong> This is a temporary password. You&apos;ll create a new secure password when you first sign in.
              </Text>
            </div>

            {/* CTA Button */}
            <div style={buttonContainerStyle}>
              <Link href={dashboardUrl} style={buttonStyle}>
                Access Dashboard
              </Link>
            </div>

            <Text style={textSmallCenterStyle}>
              Sign in with your email and temporary password to get started.
            </Text>
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <Text style={footerTextStyle}>
              Questions? Contact your team administrator or reply to this email for support.
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  );
}

const emailStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @media only screen and (max-width: 600px) {
    .email-header h1 {
      font-size: 22px !important;
      line-height: 1.3 !important;
    }
    .email-content p {
      font-size: 15px !important;
      line-height: 1.5 !important;
      margin: 0 0 16px 0 !important;
    }
    .credentials-box {
      padding: 20px 14px !important;
      margin: 24px 0 20px 0 !important;
    }
    .credentials-header {
      font-size: 15px !important;
      margin-bottom: 16px !important;
    }
    .credential-item {
      padding: 12px 14px !important;
      margin: 10px 0 !important;
    }
    .credential-label {
      font-size: 9px !important;
      margin-bottom: 8px !important;
    }
    .credential-value {
      font-size: 13px !important;
      padding: 10px 12px !important;
    }
    .password-value {
      font-size: 17px !important;
      letter-spacing: 0.14em !important;
      padding: 14px 12px !important;
    }
    .security-notice {
      padding: 14px 16px !important;
      margin: 20px 0 !important;
    }
    .security-notice p {
      font-size: 12px !important;
      line-height: 1.5 !important;
    }
    .btn {
      padding: 13px 24px !important;
      font-size: 15px !important;
      width: 100% !important;
      display: block !important;
    }
    .button-container {
      margin: 24px 0 16px 0 !important;
    }
    .text-small {
      font-size: 12px !important;
    }
    .email-footer p {
      font-size: 12px !important;
    }
  }

  @media only screen and (max-width: 480px) {
    .email-header h1 {
      font-size: 20px !important;
      line-height: 1.3 !important;
    }
    .email-content p {
      font-size: 14px !important;
      line-height: 1.5 !important;
      margin: 0 0 14px 0 !important;
    }
    .credentials-box {
      padding: 18px 12px !important;
      margin: 20px 0 16px 0 !important;
    }
    .credentials-header {
      font-size: 14px !important;
      margin-bottom: 14px !important;
    }
    .credential-item {
      padding: 10px 12px !important;
      margin: 8px 0 !important;
    }
    .credential-label {
      font-size: 9px !important;
      margin-bottom: 7px !important;
    }
    .credential-value {
      font-size: 12px !important;
      padding: 9px 10px !important;
    }
    .password-value {
      font-size: 16px !important;
      letter-spacing: 0.12em !important;
      padding: 12px 10px !important;
    }
    .security-notice {
      padding: 12px 14px !important;
      margin: 16px 0 !important;
    }
    .security-notice p {
      font-size: 11px !important;
    }
    .btn {
      padding: 12px 20px !important;
      font-size: 14px !important;
    }
    .button-container {
      margin: 20px 0 14px 0 !important;
    }
    .text-small {
      font-size: 11px !important;
    }
    .email-footer p {
      font-size: 11px !important;
    }
  }
`;

const bodyStyle: React.CSSProperties = {
  fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  backgroundColor: '#f3f1ea',
  padding: '40px 20px',
  margin: 0,
  lineHeight: '1.6',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#f3f1ea',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden',
};

const headerDarkStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  padding: '48px 40px',
  textAlign: 'center',
  color: '#ffffff',
};

const headerH1DarkStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 600,
  margin: 0,
  letterSpacing: '-0.02em',
  color: '#ffffff',
};

const contentStyle: React.CSSProperties = {
  padding: '40px 40px 48px',
  backgroundColor: '#f3f1ea',
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 20px 0',
};

const strongStyle: React.CSSProperties = {
  color: '#18181b',
  fontWeight: 600,
};

const credentialsBoxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  padding: '24px 20px',
  margin: '24px 0 20px 0',
};

const credentialsHeaderStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  marginBottom: '20px',
  letterSpacing: '-0.01em',
  color: '#18181b',
  textAlign: 'center',
};

const credentialItemStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.7)',
  padding: '12px 16px',
  margin: '10px 0',
  border: '1px solid rgba(24, 24, 27, 0.08)',
};

const credentialLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#999999',
  marginBottom: '10px',
};

const credentialValueStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.6)',
  padding: '12px 14px',
  fontSize: '14px',
  color: '#18181b',
  fontWeight: 500,
  wordBreak: 'break-all',
  fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, 'Courier New', monospace",
};

const passwordContainerStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const passwordValueStyle: React.CSSProperties = {
  flex: 1,
  textAlign: 'center',
  fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, 'Courier New', monospace",
  fontSize: '18px',
  fontWeight: 600,
  letterSpacing: '0.15em',
  backgroundColor: '#18181b',
  color: '#f3f1ea',
  padding: '14px 12px',
};

const securityNoticeStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.5)',
  padding: '16px 18px',
  margin: '24px 0',
  borderLeft: '3px solid #18181b',
};

const securityNoticeTextStyle: React.CSSProperties = {
  fontSize: '13px',
  margin: 0,
  lineHeight: '1.6',
  color: '#666666',
};

const buttonContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '28px 0 20px 0',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  color: '#f3f1ea',
  fontSize: '15px',
  fontWeight: 500,
  textDecoration: 'none',
  padding: '14px 36px',
  display: 'inline-block',
  letterSpacing: 0,
};

const textSmallCenterStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#999999',
  margin: 0,
  textAlign: 'center',
};

const footerStyle: React.CSSProperties = {
  backgroundColor: '#f3f1ea',
  padding: '32px 40px',
  textAlign: 'center',
  borderTop: '1px solid rgba(24, 24, 27, 0.1)',
};

const footerTextStyle: React.CSSProperties = {
  color: '#888888',
  fontSize: '13px',
  margin: 0,
  lineHeight: '1.5',
};
