import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
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
    const organizationId = searchParams.get('orgId') || searchParams.get('organizationId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    let orgObjectId: Types.ObjectId;
    try {
      orgObjectId = new Types.ObjectId(organizationId);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid organization ID' },
        { status: 400 }
      );
    }

    const matchStage: Record<string, unknown> = {
      organizationId: orgObjectId,
      role: 'creator',
    };

    if (status && status !== 'all') {
      matchStage['creatorProfile.status'] = status;
    }

    const searchStage =
      search && search.trim().length > 0
        ? {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { 'creatorProfile.twitterHandle': { $regex: search, $options: 'i' } },
            ],
          }
        : null;

    const creators = await User.aggregate([
      { $match: matchStage },
      ...(searchStage ? [{ $match: searchStage }] : []),
      {
        $lookup: {
          from: 'posts',
          let: { creatorId: '$_id', orgId: '$organizationId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$creatorId', '$$creatorId'] },
                    { $eq: ['$organizationId', '$$orgId'] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                postsCount: { $sum: 1 },
                approvedPosts: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'approved'] }, 1, 0],
                  },
                },
                totalEngagement: {
                  $sum: {
                    $add: [
                      { $ifNull: ['$latestMetrics.likes', 0] },
                      { $ifNull: ['$latestMetrics.retweets', 0] },
                      { $ifNull: ['$latestMetrics.replies', 0] },
                    ],
                  },
                },
              },
            },
          ],
          as: 'postStats',
        },
      },
      {
        $addFields: {
          postStats: { $first: '$postStats' },
        },
      },
      {
        $addFields: {
          postsCount: { $ifNull: ['$postStats.postsCount', 0] },
          approvedPosts: { $ifNull: ['$postStats.approvedPosts', 0] },
          totalEngagement: { $ifNull: ['$postStats.totalEngagement', 0] },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          createdAt: 1,
          twitterHandle: '$creatorProfile.twitterHandle',
          status: '$creatorProfile.status',
          postsCount: 1,
          approvedPosts: 1,
          totalEngagement: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    logger.info(
      {
        orgId: organizationId,
        count: creators.length,
        filters: { status, search },
      },
      'Fetched creators list'
    );

    return NextResponse.json(
      {
        success: true,
        data: creators.map((creator) => ({
          _id: creator._id.toString(),
          name: creator.name || '',
          email: creator.email || '',
          twitterHandle: creator.twitterHandle || '',
          status: creator.status || 'invited',
          createdAt: creator.createdAt ?? new Date(),
          postsCount: creator.postsCount || 0,
          approvedPosts: creator.approvedPosts || 0,
          totalEngagement: creator.totalEngagement || 0,
        })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40',
        },
      }
    );
  } catch (error) {
    logger.error({ error }, 'Error fetching creators');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
