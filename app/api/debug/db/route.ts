import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Organization, User } from '@/lib/db/models';

export async function GET() {
  try {
    await connectDB();
    
    const orgs = await Organization.find().populate('ownerId', 'name email').lean();
    const users = await User.find().select('name email role organizationId').lean();
    
    return NextResponse.json({
      success: true,
      data: {
        organizations: orgs,
        users: users,
        count: {
          organizations: orgs.length,
          users: users.length
        }
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
