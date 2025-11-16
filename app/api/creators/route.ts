import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('creators-api');

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
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const query: Record<string, unknown> = {
      organizationId,
      role: 'creator',
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const creators = await User.find(query)
      .select('name email twitterHandle status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    logger.info(
      {
        orgId: organizationId,
        count: creators.length,
      },
      'Fetched creators list'
    );

    return NextResponse.json({
      success: true,
      data: creators,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching creators');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
