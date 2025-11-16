import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User, Post } from '@/lib/db/models';
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
    const organizationId = searchParams.get('orgId') || searchParams.get('organizationId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

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
      query['creatorProfile.status'] = status;
    }

    const creators = await User.find(query)
      .select('name email creatorProfile createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get stats for each creator
    const creatorsWithStats = await Promise.all(
      creators.map(async (creator: any) => {
        const postsCount = await Post.countDocuments({
          organizationId,
          creatorId: creator._id,
        });

        const approvedPosts = await Post.countDocuments({
          organizationId,
          creatorId: creator._id,
          status: 'approved',
        });

        // Get total engagement
        const posts = await Post.find({
          organizationId,
          creatorId: creator._id,
          status: 'approved',
        })
          .select('latestMetrics')
          .lean();

        const totalEngagement = posts.reduce((sum: number, post: any) => {
          const metrics = post.latestMetrics || {};
          return (
            sum +
            (metrics.likes || 0) +
            (metrics.retweets || 0) +
            (metrics.replies || 0)
          );
        }, 0);

        return {
          _id: creator._id.toString(),
          name: creator.name || '',
          email: creator.email || '',
          twitterHandle: creator.creatorProfile?.twitterHandle || '',
          status: creator.creatorProfile?.status || 'invited',
          createdAt: creator.createdAt || new Date(),
          postsCount,
          approvedPosts,
          totalEngagement,
        };
      })
    );

    // Apply search filter
    let filteredCreators = creatorsWithStats;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCreators = creatorsWithStats.filter(
        (creator) =>
          creator.name?.toLowerCase().includes(searchLower) ||
          creator.email?.toLowerCase().includes(searchLower) ||
          creator.twitterHandle?.toLowerCase().includes(searchLower)
      );
    }

    logger.info(
      {
        orgId: organizationId,
        count: filteredCreators.length,
        filters: { status, search },
      },
      'Fetched creators list'
    );

    return NextResponse.json({
      success: true,
      data: filteredCreators,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching creators');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
