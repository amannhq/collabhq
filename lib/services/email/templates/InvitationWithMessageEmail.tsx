import * as React from 'react';
import { Html, Head, Body, Container, Text, Link, Heading } from '@react-email/components';

interface InvitationWithMessageEmailNewProps {
  name: string;
  organizationName: string;
  projectName: string;
  inviteUrl: string;
  message: string;
}

export function InvitationWithMessageEmail({
  name,
  organizationName,
  projectName,
  inviteUrl,
  message,
}: InvitationWithMessageEmailNewProps) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>You&apos;re Invited!</title>
        <style dangerouslySetInnerHTML={{ __html: emailStyles }} />
      </Head>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <Heading style={headerH1Style}>You&apos;re Invited! 🎉</Heading>
          </div>

          {/* Content */}
          <div style={contentStyle}>
            <Text style={paragraphStyle}>
              Hi <strong style={strongStyle}>{name}</strong>,
            </Text>

            <Text style={paragraphStyle}>
              <strong style={strongStyle}>{organizationName}</strong> has invited you to join their team as a content creator
              for the <strong style={strongStyle}>{projectName}</strong> project.
            </Text>

            {/* Message Box */}
            <div style={messageBoxStyle}>
              <Text style={messageBoxLabelStyle}>Message from the team:</Text>
              <Text style={messageBoxTextStyle}>{message}</Text>
            </div>

            <Text style={paragraphStyle}>
              Click the button below to accept your invitation and set up your account.
            </Text>

            {/* CTA Button */}
            <div style={buttonContainerStyle}>
              <Link href={inviteUrl} style={buttonStyle}>
                Accept Invitation
              </Link>
            </div>

            <Text style={textSmallStyle}>
              This invitation will expire in 7 days.
            </Text>
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <Text style={footerTextStyle}>
              If you didn&apos;t expect this invitation, you can safely ignore this email.
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
    .message-box {
      padding: 16px !important;
      margin: 20px 0 !important;
    }
    .message-box-label {
      font-size: 12px !important;
      margin-bottom: 6px !important;
    }
    .message-box-text {
      font-size: 14px !important;
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
    .message-box {
      padding: 14px !important;
      margin: 16px 0 !important;
    }
    .message-box-label {
      font-size: 11px !important;
      margin-bottom: 5px !important;
    }
    .message-box-text {
      font-size: 13px !important;
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

const headerStyle: React.CSSProperties = {
  backgroundColor: '#f3f1ea',
  padding: '48px 40px',
  textAlign: 'center',
};

const headerH1Style: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 600,
  margin: 0,
  letterSpacing: '-0.02em',
  color: '#18181b',
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

const messageBoxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  padding: '20px',
  margin: '28px 0',
  borderLeft: '3px solid #18181b',
};

const messageBoxLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '14px',
  margin: '0 0 8px 0',
  color: '#18181b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const messageBoxTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#555555',
  fontSize: '15px',
  lineHeight: '1.5',
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

const textSmallStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#999999',
  margin: 0,
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
