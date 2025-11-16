import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User, Organization } from '@/lib/db/models';
import { getSession } from '@/lib/auth/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
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

    const { orgId } = await params;

    const organization = await Organization.findById(orgId);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // For now, return just the owner
    // In a full implementation, you'd have a separate Members collection or field
    const owner = await User.findById(organization.ownerId)
      .select('name email')
      .lean();

    if (!owner) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const members = [{
      _id: (owner as { _id: unknown; email?: string; name?: string })._id,
      email: (owner as { _id: unknown; email?: string; name?: string }).email || '',
      name: (owner as { _id: unknown; email?: string; name?: string }).name || 'Owner',
      role: 'owner' as const,
      joinedAt: organization.createdAt,
    }];

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
