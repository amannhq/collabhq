import * as React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import connectDB from '@/lib/db/mongodb';
import { EmailTemplate } from '@/lib/db/models';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';
import { BaseEmailTemplate } from '@/lib/services/email/templates/BaseEmailTemplate';

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
      : '';    // Render template to HTML
    const html = await render(
      <BaseEmailTemplate
        branding={template.branding as { primaryColor?: string; secondaryColor?: string; logoUrl?: string; fontFamily?: string } | undefined}
        content={{
          heading,
          body: bodyContent,
          ctaText: template.content.ctaText,
          ctaUrl: sampleData?.ctaUrl || '#',
          footerText: template.content.footerText,
        }}
        previewText={template.previewText}
      />
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
