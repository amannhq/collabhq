import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { EmailTemplate } from '@/lib/db/models';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('email-templates-api');

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const query: Record<string, unknown> = {
      organizationId: session.user.organizationId,
    };

    if (slug) {
      query.slug = slug;
    }

    const templates = await EmailTemplate.find(query)
      .sort({ createdAt: -1 })
      .lean();

    logger.info(
      {
        orgId: session.user.organizationId,
        count: templates.length,
      },
      'Fetched email templates'
    );

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching email templates');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can create templates
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      category,
      subject,
      previewText,
      branding,
      content,
      variables,
      isActive,
      isDefault,
    } = body;

    // Check if template with same slug already exists
    const existing = await EmailTemplate.findOne({
      organizationId: session.user.organizationId,
      slug,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Template with this slug already exists' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await EmailTemplate.updateMany(
        {
          organizationId: session.user.organizationId,
          slug,
          isDefault: true,
        },
        { isDefault: false }
      );
    }

    const template = await EmailTemplate.create({
      organizationId: session.user.organizationId,
      name,
      slug,
      category,
      subject,
      previewText,
      branding,
      content,
      variables,
      isActive: isActive ?? true,
      isDefault: isDefault ?? false,
      usageCount: 0,
    });

    logger.info(
      {
        templateId: template._id.toString(),
        slug,
        orgId: session.user.organizationId,
      },
      'Email template created'
    );

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error({ error }, 'Error creating email template');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
