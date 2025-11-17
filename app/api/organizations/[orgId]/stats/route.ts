import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Organization, Project, Post, User, type IOrganization } from '@/lib/db/models';
import { getSession } from '@/lib/auth/auth-utils';
import { createLogger } from '@/lib/utils/logger';
import { cache, CacheKeys } from '@/lib/utils/cache';

const logger = createLogger('org-stats-api');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;
    
    // Try to get from cache first (2 minute cache)
    const cacheKey = CacheKeys.orgStats(orgId);
    const cachedData = cache.get<any>(cacheKey);
    
    if (cachedData) {
      logger.info({ orgId, cached: true }, 'Organization stats served from cache');
      return NextResponse.json(
        {
          success: true,
          data: cachedData,
        },
        {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300, max-age=60',
            'CDN-Cache-Control': 'public, s-maxage=120',
            'Vercel-CDN-Cache-Control': 'public, s-maxage=120',
          },
        }
      );
    }
    
    const organization = await Organization.findById(orgId).lean<IOrganization>();

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check access
    if (organization.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Calculate growth data for charts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // OPTIMIZED: Use aggregation pipeline for engagement metrics (much faster)
    const engagementMetrics = await Post.aggregate([
      {
        $match: {
          organizationId: organization._id,
          status: 'approved',
        },
      },
      {
        $group: {
          _id: null,
          totalEngagement: {
            $sum: {
              $add: [
                { $ifNull: ['$latestMetrics.likes', 0] },
                { $ifNull: ['$latestMetrics.retweets', 0] },
                { $ifNull: ['$latestMetrics.replies', 0] },
              ],
            },
          },
          totalImpressions: {
            $sum: { $ifNull: ['$latestMetrics.impressions', 0] },
          },
        },
      },
    ]);

    const totalEngagement = engagementMetrics[0]?.totalEngagement || 0;
    const totalImpressions = engagementMetrics[0]?.totalImpressions || 0;

    // Get all statistics in parallel - OPTIMIZED with fewer queries
    const [
      totalProjects,
      activeProjects,
      totalCreators,
      activeCreators,
      totalPosts,
      approvedPosts,
      pendingPosts,
      recentPosts,
      chartData,
    ] = await Promise.all([
      Project.countDocuments({ organizationId: orgId }),
      Project.countDocuments({ organizationId: orgId, status: 'active' }),
      User.countDocuments({ organizationId: orgId, role: 'creator' }),
      User.countDocuments({
        organizationId: orgId,
        role: 'creator',
        'creatorProfile.status': 'active',
      }),
      Post.countDocuments({ organizationId: orgId }),
      Post.countDocuments({ organizationId: orgId, status: 'approved' }),
      Post.countDocuments({ organizationId: orgId, status: 'pending' }),
      Post.find({ organizationId: orgId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('postUrl status createdAt creatorId projectId') // Only select needed fields
        .populate('creatorId', 'name email')
        .populate('projectId', 'name')
        .lean(),
      Post.aggregate([
        {
          $match: {
            organizationId: organization._id,
            status: 'approved',
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            likes: { $sum: { $ifNull: ['$latestMetrics.likes', 0] } },
            retweets: { $sum: { $ifNull: ['$latestMetrics.retweets', 0] } },
            replies: { $sum: { $ifNull: ['$latestMetrics.replies', 0] } },
            impressions: { $sum: { $ifNull: ['$latestMetrics.impressions', 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const stats = {
      totalProjects,
      activeProjects,
      totalCreators,
      activeCreators,
      totalPosts,
      approvedPosts,
      pendingPosts,
      totalEngagement,
      totalImpressions,
    };

    const responseData = {
      stats,
      recentPosts,
      chartData,
    };

    // Cache for 2 minutes
    cache.set(cacheKey, responseData, 120);

    logger.info({ orgId, userId: session.user.id, cached: false }, 'Organization stats fetched from DB');

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      {
        headers: {
          'X-Cache': 'MISS',
          // Aggressive caching for dashboard stats
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300, max-age=60',
          'CDN-Cache-Control': 'public, s-maxage=120',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=120',
        },
      }
    );
  } catch (error) {
    logger.error({ error }, 'Error fetching organization stats');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
