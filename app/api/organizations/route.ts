import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Organization from '@/lib/db/models/Organization';
import { getSession } from '@/lib/auth/auth-utils';

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
    const orgId = searchParams.get('id');

    if (!slug && !orgId) {
      return NextResponse.json(
        { success: false, error: 'Slug or ID is required' },
        { status: 400 }
      );
    }

    // Find organization by slug or ID
    const query = slug ? { slug } : { _id: orgId };
    const organization = await Organization.findOne(query).lean() as { ownerId: { toString(): string }; _id: { toString(): string } } | null;

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this organization
    const hasAccess = 
      organization.ownerId.toString() === session.user.id ||
      session.user.organizationId === organization._id.toString();

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
