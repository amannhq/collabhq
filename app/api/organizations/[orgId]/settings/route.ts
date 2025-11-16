import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Organization from '@/lib/db/models/Organization';
import { getSession } from '@/lib/auth/auth-utils';
import { z } from 'zod';

const settingsSchema = z.object({
  logo: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  notificationEmail: z.string().email().optional().or(z.literal('')),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  emailSignature: z.string().optional(),
  emailFromName: z.string().optional(),
  notifications: z.object({
    emailOnNewPost: z.boolean().optional(),
    emailOnPostApproved: z.boolean().optional(),
    emailOnPostRejected: z.boolean().optional(),
    emailOnCreatorJoined: z.boolean().optional(),
    emailOnWeeklyReport: z.boolean().optional(),
    emailOnMonthlyReport: z.boolean().optional(),
  }).optional(),
});

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

    const organization = await Organization.findById(orgId).lean() as { ownerId: { toString(): string }; settings?: unknown } | null;

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const isOwner = organization.ownerId.toString() === session.user.id;
    
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: organization.settings
    });
  } catch (error) {
    console.error('Error fetching organization settings:', error);
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
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;
    const body = await request.json();

    // Validate settings
    const validation = settingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const organization = await Organization.findById(orgId);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const isOwner = organization.ownerId.toString() === session.user.id;
    
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update settings
    organization.settings = {
      ...organization.settings,
      ...validation.data
    };

    await organization.save();

    return NextResponse.json({
      success: true,
      data: organization.settings
    });
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
