import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Post, Project } from '@/lib/db/models';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('posts-stats-api');

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
    const status = searchParams.get('status') || 'all';

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // Get all projects for this org
    const projects = await Project.find({ organizationId }).select('_id');
    const projectIds = projects.map((p) => p._id);

    // Build query for posts
    const query: Record<string, unknown> = { projectId: { $in: projectIds } };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get posts with populated data
    const posts = await Post.find(query)
      .populate('creatorId', 'name email twitterHandle')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get counts for all statuses
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      Post.countDocuments({ projectId: { $in: projectIds }, status: 'pending' }),
      Post.countDocuments({ projectId: { $in: projectIds }, status: 'approved' }),
      Post.countDocuments({ projectId: { $in: projectIds }, status: 'rejected' }),
    ]);

    const totalCount = pendingCount + approvedCount + rejectedCount;

    // Transform posts data
    const transformedPosts = posts.map((p: any) => ({
      _id: p._id.toString(),
      postUrl: p.postUrl || '',
      caption: p.caption,
      status: p.status || 'pending',
      creatorId: {
        _id: p.creatorId?._id?.toString() || '',
        name: p.creatorId?.name || '',
        email: p.creatorId?.email || '',
        twitterHandle: p.creatorId?.twitterHandle,
      },
      projectId: {
        _id: p.projectId?._id?.toString() || '',
        name: p.projectId?.name || '',
      },
      latestMetrics: p.latestMetrics ? {
        likes: p.latestMetrics.likes || 0,
        retweets: p.latestMetrics.retweets || 0,
        replies: p.latestMetrics.replies || 0,
        impressions: p.latestMetrics.impressions || 0,
      } : undefined,
      createdAt: p.createdAt || new Date(),
    }));

    logger.info(
      {
        orgId: organizationId,
        status,
        postsCount: transformedPosts.length,
        totalCount,
      },
      'Posts stats fetched'
    );

    return NextResponse.json({
      success: true,
      data: {
        posts: transformedPosts,
        counts: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total: totalCount,
        },
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    }
    );
  } catch (error) {
    logger.error({ error }, 'Error fetching posts stats');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
