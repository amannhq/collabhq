import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr } from '@react-email/components';

interface OTPEmailNewProps {
  otp: string;
  title: string;
  description: string;
}

export function OTPEmail({
  otp,
  title,
  description,
}: OTPEmailNewProps) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>Verification Code</title>
        <style dangerouslySetInnerHTML={{ __html: emailStyles }} />
      </Head>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Logo Section */}
          <div style={logoSectionStyle}>
            <div style={logoTextStyle}>Collab</div>
          </div>

          {/* Content */}
          <div style={contentStyle}>
            <Heading as="h1" style={titleStyle}>{title}</Heading>

            <Text style={descriptionStyle}>{description}</Text>

            {/* OTP Box */}
            <div style={otpBoxStyle}>
              <div style={otpTextStyle}>{otp}</div>
            </div>

            <Text style={textMutedStyle}>
              This code will expire in 5 minutes.
            </Text>

            {/* Security Box */}
            <div style={securityBoxStyle}>
              <Text style={securityBoxTextStyle}>🔒 For your security, never share this code with anyone.</Text>
            </div>
          </div>

          {/* Divider */}
          <Hr style={dividerStyle} />

          {/* Footer */}
          <div style={footerStyle}>
            <Text style={footerTextPrimaryStyle}>
              © 2025 Collab. Built for creator first teams.
            </Text>
            <Text style={footerTextSecondaryStyle}>
              If you didn&apos;t request this code, please ignore this email.
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
    .logo-section {
      padding: 24px 20px !important;
    }
    .logo-text {
      font-size: 20px !important;
    }
    .email-content {
      padding: 28px 20px 32px !important;
    }
    .email-content p {
      font-size: 15px !important;
      line-height: 1.5 !important;
      margin: 0 0 16px 0 !important;
    }
    .otp-box {
      padding: 28px 16px !important;
      margin: 24px 0 !important;
    }
    .otp-text {
      font-size: 34px !important;
      letter-spacing: 0.16em !important;
    }
    .security-box {
      padding: 14px 16px !important;
      margin-top: 20px !important;
    }
    .security-box p {
      font-size: 12px !important;
      line-height: 1.5 !important;
    }
    .title {
      font-size: 22px !important;
      margin-bottom: 12px !important;
    }
    .description {
      font-size: 14px !important;
    }
    .text-muted {
      font-size: 12px !important;
    }
    .email-footer p {
      font-size: 12px !important;
    }
  }

  @media only screen and (max-width: 480px) {
    .logo-section {
      padding: 20px 16px !important;
    }
    .logo-text {
      font-size: 18px !important;
    }
    .email-content {
      padding: 24px 16px 28px !important;
    }
    .email-content p {
      font-size: 14px !important;
      line-height: 1.5 !important;
      margin: 0 0 14px 0 !important;
    }
    .otp-box {
      padding: 24px 12px !important;
      margin: 20px 0 !important;
    }
    .otp-text {
      font-size: 30px !important;
      letter-spacing: 0.14em !important;
    }
    .security-box {
      padding: 12px 14px !important;
      margin-top: 16px !important;
    }
    .security-box p {
      font-size: 11px !important;
    }
    .title {
      font-size: 20px !important;
      margin-bottom: 10px !important;
    }
    .description {
      font-size: 13px !important;
    }
    .text-muted {
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

const logoSectionStyle: React.CSSProperties = {
  backgroundColor: '#f3f1ea',
  padding: '32px 40px',
  textAlign: 'center',
  borderBottom: '1px solid #e5e5e5',
};

const logoTextStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#18181b',
  margin: 0,
  letterSpacing: '-0.02em',
};

const contentStyle: React.CSSProperties = {
  padding: '40px 40px 48px',
  backgroundColor: '#f3f1ea',
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 600,
  color: '#18181b',
  margin: '0 0 16px 0',
  lineHeight: '1.3',
  letterSpacing: '-0.02em',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#555555',
  margin: '0 0 32px 0',
};

const otpBoxStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  padding: '40px 32px',
  textAlign: 'center',
  margin: '32px 0',
};

const otpTextStyle: React.CSSProperties = {
  fontSize: '42px',
  fontWeight: 600,
  letterSpacing: '0.2em',
  color: '#f3f1ea',
  margin: 0,
  fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, 'Courier New', monospace",
};

const textMutedStyle: React.CSSProperties = {
  color: '#888888',
  fontSize: '13px',
  textAlign: 'center',
  margin: '24px 0',
};

const securityBoxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  padding: '16px 20px',
  marginTop: '24px',
};

const securityBoxTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#555555',
  margin: 0,
  lineHeight: '1.5',
  textAlign: 'center',
};

const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #e5e5e5',
  margin: 0,
};

const footerStyle: React.CSSProperties = {
  backgroundColor: '#f3f1ea',
  padding: '32px 40px',
  textAlign: 'center',
  borderTop: '1px solid rgba(24, 24, 27, 0.1)',
};

const footerTextPrimaryStyle: React.CSSProperties = {
  color: '#888888',
  fontSize: '13px',
  margin: '0 0 8px 0',
  lineHeight: '1.5',
};

const footerTextSecondaryStyle: React.CSSProperties = {
  color: 'rgba(0, 0, 0, 0.4)',
  fontSize: '13px',
  margin: 0,
  lineHeight: '1.5',
};
