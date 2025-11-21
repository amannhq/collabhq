import * as React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import connectDB from '@/lib/db/mongodb';
import { EmailTemplate } from '@/lib/db/models';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';
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

const logger = createLogger('email-template-preview-api');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { sampleData } = body;

    type TemplateLean = {
      _id: { toString(): string };
      organizationId: { toString(): string };
      subject?: string;
      content: { body?: string; heading?: string; ctaText?: string; footerText?: string };
      branding?: unknown;
      previewText?: string;
    };
    const template = await EmailTemplate.findById(resolvedParams.templateId).lean() as TemplateLean | null;

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Verify template belongs to user's organization
    if (template.organizationId.toString() !== session.user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Replace variables with sample data
    function replaceVariables(content: string, data: Record<string, string>): string {
      let result = content;
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value);
      }
      return result;
    }

    const bodyContent = replaceVariables(template.content.body || '', sampleData || {});
    const heading = template.content.heading
      ? replaceVariables(template.content.heading, sampleData || {})
      : '';

    // Extract branding settings with defaults
    const branding = template.branding as { primaryColor?: string; secondaryColor?: string; logoUrl?: string; fontFamily?: string } | undefined;
    const primaryColor = branding?.primaryColor || '#000000';
    const secondaryColor = branding?.secondaryColor || '#000000';
    const logoUrl = branding?.logoUrl;
    const fontFamily = branding?.fontFamily || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Render template to HTML
    const html = await render(
      <Html>
        <Head />
        {template.previewText && <Preview>{template.previewText}</Preview>}
        <Body style={{ backgroundColor: '#f3f1ea', padding: '40px 0', fontFamily }}>
          <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', marginBottom: '64px', borderRadius: '16px', overflow: 'hidden', maxWidth: '600px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
            {/* Header with Logo */}
            {logoUrl && (
              <Section style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f3f1ea' }}>
                <Img src={logoUrl} width="150" height="50" alt="Logo" style={{ margin: '0 auto', display: 'block' }} />
              </Section>
            )}

            {/* Header Background */}
            {heading && (
              <Section style={{ padding: '40px', textAlign: 'center', color: '#ffffff', background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
                <Heading style={{ color: '#ffffff', fontSize: '32px', fontWeight: '600', margin: '0', padding: '0', letterSpacing: '-0.5px' }}>{heading}</Heading>
              </Section>
            )}

            {/* Content */}
            <Section style={{ padding: '40px' }}>
              <div dangerouslySetInnerHTML={{ __html: bodyContent }} />

              {/* CTA Button */}
              {template.content.ctaText && sampleData?.ctaUrl && (
                <Section style={{ textAlign: 'center', margin: '32px 0' }}>
                  <Button
                    style={{ backgroundColor: primaryColor, borderRadius: '12px', color: '#ffffff', fontSize: '17px', fontWeight: '600', textDecoration: 'none', textAlign: 'center', display: 'inline-block', padding: '16px 32px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                    href={sampleData?.ctaUrl || '#'}
                  >
                    {template.content.ctaText}
                  </Button>
                </Section>
              )}

              {/* Link fallback */}
              {sampleData?.ctaUrl && (
                <Text style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.5)', marginTop: '24px', textAlign: 'center' }}>
                  Or copy and paste this link into your browser:
                  <br />
                  <Link href={sampleData.ctaUrl} style={{ color: '#000000', textDecoration: 'underline', display: 'block', marginTop: '8px', wordBreak: 'break-all' }}>
                    {sampleData.ctaUrl}
                  </Link>
                </Text>
              )}
            </Section>

            {/* Footer */}
            <Section style={{ textAlign: 'center', padding: '32px', borderTop: '1px solid rgba(0, 0, 0, 0.1)', backgroundColor: '#f3f1ea' }}>
              <Text style={{ color: 'rgba(0, 0, 0, 0.5)', fontSize: '13px', margin: '0' }}>
                {template.content.footerText || "If you didn't expect this email, you can safely ignore it."}
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );

    logger.info(
      {
        templateId: template._id.toString(),
      },
      'Email template preview generated'
    );

    return NextResponse.json({
      success: true,
      data: {
        html,
        subject: replaceVariables(template.subject || '', sampleData || {}),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error generating email template preview');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
