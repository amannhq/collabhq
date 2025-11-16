import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface BaseEmailTemplateProps {
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    fontFamily?: string;
  };
  content: {
    heading?: string;
    body: string;
    ctaText?: string;
    ctaUrl?: string;
    footerText?: string;
  };
  previewText?: string;
}

export const BaseEmailTemplate = ({
  branding = {},
  content,
  previewText,
}: BaseEmailTemplateProps) => {
  const {
    primaryColor = '#667eea',
    secondaryColor = '#764ba2',
    logoUrl,
    fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  } = branding;

  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={{ ...main, fontFamily }}>
        <Container style={container}>
          {/* Header with Logo */}
          {logoUrl && (
            <Section style={header}>
              <Img
                src={logoUrl}
                width="150"
                height="50"
                alt="Logo"
                style={logo}
              />
            </Section>
          )}

          {/* Header Background */}
          {content.heading && (
            <Section
              style={{
                ...headerSection,
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              }}
            >
              <Heading style={h1}>{content.heading}</Heading>
            </Section>
          )}

          {/* Content */}
          <Section style={contentSection}>
            <div dangerouslySetInnerHTML={{ __html: content.body }} />

            {/* CTA Button */}
            {content.ctaText && content.ctaUrl && (
              <Section style={buttonContainer}>
                <Button
                  style={{
                    ...button,
                    backgroundColor: primaryColor,
                  }}
                  href={content.ctaUrl}
                >
                  {content.ctaText}
                </Button>
              </Section>
            )}

            {/* Link fallback */}
            {content.ctaUrl && (
              <Text style={linkText}>
                Or copy and paste this link into your browser:
                <br />
                <Link href={content.ctaUrl} style={link}>
                  {content.ctaUrl}
                </Link>
              </Text>
            )}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              {content.footerText ||
                "If you didn't expect this email, you can safely ignore it."}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  marginBottom: '64px',
  borderRadius: '8px',
  overflow: 'hidden' as const,
  maxWidth: '600px',
};

const header = {
  padding: '20px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e5e7eb',
};

const logo = {
  margin: '0 auto',
  display: 'block',
};

const headerSection = {
  padding: '30px',
  textAlign: 'center' as const,
  color: '#ffffff',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const contentSection = {
  padding: '30px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#667eea',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const linkText = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '20px',
  textAlign: 'center' as const,
};

const link = {
  color: '#667eea',
  textDecoration: 'none',
  display: 'block',
  marginTop: '8px',
  wordBreak: 'break-all' as const,
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px',
  borderTop: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
};

export default BaseEmailTemplate;
