import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Organization, type IOrganization } from '@/lib/db/models';
import { requireAuth } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('org-api');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await connectDB();
    const session = await requireAuth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;
    const organization = await Organization.findById(orgId).lean<IOrganization>();
    
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this organization
    if (organization.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    logger.info({ orgId, userId: session.user.id }, 'Organization fetched');

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching organization');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await connectDB();
    const session = await requireAuth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;
    const organization = await Organization.findById(orgId);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner
    if (organization.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug, settings } = body;

    if (name) organization.name = name;
    if (slug) {
      // Check if slug is already taken
      const existingOrg = await Organization.findOne({ 
        slug,
        _id: { $ne: orgId }
      });
      
      if (existingOrg) {
        return NextResponse.json(
          { success: false, error: 'Slug is already taken' },
          { status: 400 }
        );
      }
      
      organization.slug = slug;
    }
    if (settings) {
      organization.settings = {
        ...organization.settings,
        ...settings,
      };
    }

    await organization.save();

    logger.info({ orgId, userId: session.user.id }, 'Organization updated');

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    logger.error({ error }, 'Error updating organization');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await connectDB();
    const session = await requireAuth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;
    const organization = await Organization.findById(orgId);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner
    if (organization.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the owner can delete the organization' },
        { status: 403 }
      );
    }

    // TODO: Delete all related data (projects, posts, creators, metrics, etc.)
    // This should be done in a transaction or background job for data integrity
    
    await organization.deleteOne();

    logger.info({ orgId, userId: session.user.id }, 'Organization deleted');

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error deleting organization');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
