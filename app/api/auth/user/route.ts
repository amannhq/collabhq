import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ensureDbConnection } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('auth-user-api');

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await ensureDbConnection();

    const user = await User.findById(session.user.id)
      .select('_id email name role organizationId creatorProfile')
      .populate('organizationId', 'slug')
      .lean<{
        _id: { toString(): string };
        email: string;
        name: string;
        role: string;
        organizationId?: { toString(): string; slug?: string };
        creatorProfile?: unknown;
      }>();

    if (!user) {
      logger.warn({ email: session.user.email }, 'User not found');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    logger.info({ userId: user._id.toString(), role: user.role }, 'Fetched user data');

    return NextResponse.json({
      success: true,
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId?.toString(),
      organizationSlug: typeof user.organizationId === 'object' ? user.organizationId.slug : undefined,
      creatorProfile: user.creatorProfile,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching user data');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
