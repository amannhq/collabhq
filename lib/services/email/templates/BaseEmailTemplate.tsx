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
    primaryColor = '#000000',
    secondaryColor = '#000000',
    logoUrl,
    fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  backgroundColor: '#f3f1ea',
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  marginBottom: '64px',
  borderRadius: '16px',
  overflow: 'hidden' as const,
  maxWidth: '600px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};

const header = {
  padding: '32px',
  textAlign: 'center' as const,
  backgroundColor: '#f3f1ea',
};

const logo = {
  margin: '0 auto',
  display: 'block',
};

const headerSection = {
  padding: '40px',
  textAlign: 'center' as const,
  color: '#ffffff',
  backgroundColor: '#000000',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '600',
  margin: '0',
  padding: '0',
  letterSpacing: '-0.5px',
};

const contentSection = {
  padding: '40px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '17px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const linkText = {
  fontSize: '14px',
  color: 'rgba(0, 0, 0, 0.5)',
  marginTop: '24px',
  textAlign: 'center' as const,
};

const link = {
  color: '#000000',
  textDecoration: 'underline',
  display: 'block',
  marginTop: '8px',
  wordBreak: 'break-all' as const,
};

const footer = {
  textAlign: 'center' as const,
  padding: '32px',
  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
  backgroundColor: '#f3f1ea',
};

const footerText = {
  color: 'rgba(0, 0, 0, 0.5)',
  fontSize: '13px',
  margin: '0',
};

export default BaseEmailTemplate;
