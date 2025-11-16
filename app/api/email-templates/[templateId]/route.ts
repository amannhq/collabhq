import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { EmailTemplate } from '@/lib/db/models';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('email-template-detail-api');

export async function GET(
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
    const template = await EmailTemplate.findById(resolvedParams.templateId).lean() as { organizationId: { toString(): string } } | null;

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

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching email template');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Only admins can update templates
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const {
      name,
      subject,
      previewText,
      branding,
      content,
      variables,
      isActive,
      isDefault,
    } = body;

    const template = await EmailTemplate.findById(resolvedParams.templateId);

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

    // If setting as default, unset other defaults
    if (isDefault && !template.isDefault) {
      await EmailTemplate.updateMany(
        {
          organizationId: session.user.organizationId,
          slug: template.slug,
          isDefault: true,
        },
        { isDefault: false }
      );
    }

    // Update template
    if (name !== undefined) template.name = name;
    if (subject !== undefined) template.subject = subject;
    if (previewText !== undefined) template.previewText = previewText;
    if (branding !== undefined) template.branding = branding;
    if (content !== undefined) template.content = content;
    if (variables !== undefined) template.variables = variables;
    if (isActive !== undefined) template.isActive = isActive;
    if (isDefault !== undefined) template.isDefault = isDefault;

    await template.save();

    logger.info(
      {
        templateId: template._id.toString(),
        slug: template.slug,
      },
      'Email template updated'
    );

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error({ error }, 'Error updating email template');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Only admins can delete templates
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const template = await EmailTemplate.findById(resolvedParams.templateId);

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

    await template.deleteOne();

    logger.info(
      {
        templateId: resolvedParams.templateId,
        slug: template.slug,
      },
      'Email template deleted'
    );

    return NextResponse.json({
      success: true,
      data: { message: 'Template deleted successfully' },
    });
  } catch (error) {
    logger.error({ error }, 'Error deleting email template');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
