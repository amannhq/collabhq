import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { Post, Project } from '@/lib/db/models';
import { createLogger } from '@/lib/utils/logger';
import { validateSearchParams, PostsQuerySchema, PostCreateSchema } from '@/lib/api/validation';
import { withErrorHandler, NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/error-handler';
import { withAuth } from '@/lib/api/auth-middleware';

const logger = createLogger('posts-api');

export const GET = withErrorHandler(withAuth(async (request: NextRequest, { user }) => {
  await connectDB();

  const { searchParams } = new URL(request.url);

  // Validate and sanitize search params with Zod
  const validation = validateSearchParams(PostsQuerySchema, searchParams);
  if (!validation.success) {
    return validation.error;
  }

  const { organizationId, status, projectId, creatorId, search, page, limit } = validation.data;
  const skip = (page - 1) * limit;

  if (!organizationId) {
    throw BadRequestError('Organization ID required');
  }

  // Verify user has access to organization
  const { Organization } = await import('@/lib/db/models');
  const organization = await Organization.findById(organizationId);

  if (!organization) {
    throw NotFoundError('Organization');
  }

  if (organization.ownerId.toString() !== user.id) {
    throw ForbiddenError('You do not have access to this organization');
  }

  let orgObjectId: Types.ObjectId;
  try {
    orgObjectId = new Types.ObjectId(organizationId);
  } catch {
    throw BadRequestError('Invalid organization ID format');
  }

  // Build query scoped to organization
  const query: Record<string, unknown> = {
    organizationId: orgObjectId,
  };

  if (status && status !== 'all') {
    query.status = status;
  }

  // Zod already validated these are valid ObjectIds
  if (projectId) {
    query.projectId = new Types.ObjectId(projectId);
  }

  if (creatorId) {
    query.creatorId = new Types.ObjectId(creatorId);
  }

  // Search is already sanitized by Zod (regex special chars escaped)
  // This prevents ReDoS attacks
  if (search) {
    query.$or = [
      { postUrl: { $regex: search, $options: 'i' } },
      { caption: { $regex: search, $options: 'i' } },
    ];
  }

  // Get posts with pagination - OPTIMIZED
  const [posts, total] = await Promise.all([
    Post.find(query)
      .select('postUrl status createdAt updatedAt latestMetrics creatorId projectId tweetId') // Only select needed fields
      .populate('creatorId', 'name email twitterHandle')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(query),
  ]);

  logger.info(
    { organizationId: orgObjectId.toHexString(), total, page, limit },
    'Posts fetched successfully'
  );

  return NextResponse.json(
    {
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    },
    {
      headers: {
        // Cache posts list for 1 minute
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
      },
    }
  );
}));

export const POST = withErrorHandler(withAuth(async (request: NextRequest, { user }) => {
  await connectDB();

  // Validate request body with Zod (HOF handles Zod errors automatically)
  const body = await request.json();
  const validatedData = PostCreateSchema.parse(body);
  const { projectId, postUrl, caption, metrics } = validatedData;

  // Get project and verify access
  const project = await Project.findById(projectId).populate('organizationId');

  if (!project) {
    throw NotFoundError('Project');
  }

    // Check if user is creator in this project or admin
  const { User } = await import('@/lib/db/models');
  const currentUser = await User.findById(user.id);

  if (!currentUser) {
    throw NotFoundError('User');
  }

  const isCreator = currentUser.creatorProfile?.projectId?.toString() === projectId;
  const isAdmin = project.organizationId.ownerId.toString() === user.id;

  if (!isCreator && !isAdmin) {
    throw ForbiddenError('You do not have permission to create posts in this project');
  }

  // Extract tweet ID from URL (handles query parameters like ?s=20, ?t=xxx&s=19, etc.)
  // Twitter/X tweet IDs are 19 digits long
  const tweetIdMatch = postUrl.match(/\/status\/(\d{10,20})(?:[/?#&]|$)/);
  if (!tweetIdMatch) {
    throw BadRequestError('Invalid Twitter/X post URL. URL must contain /status/{tweet_id}');
  }
  const tweetId = tweetIdMatch[1];

  // Get organization ID from project
  const organizationId = project.organizationId._id || project.organizationId;

  // Create post
  const post = await Post.create({
    projectId,
    creatorId: user.id,
    organizationId,
    postUrl,
    tweetId,
    content: caption || '',
    status: project.settings.requirePostApproval ? 'pending' : 'approved',
    latestMetrics: {
      likes: metrics?.likes || 0,
      retweets: metrics?.retweets || 0,
      replies: metrics?.replies || 0,
      quotes: metrics?.quotes || 0,
      impressions: metrics?.impressions || 0,
      engagementRate: 0, // Will be calculated
      lastUpdatedAt: new Date(),
      updatedBy: user.id,
    },
    growth: {
      likesDelta: 0,
      retweetsDelta: 0,
      repliesDelta: 0,
      impressionsDelta: 0,
      engagementRateDelta: 0,
    },
    reminders: {
      sentCount: 0,
      reminderFrequency: project.settings.reminderFrequencyHours || 24,
    },
    metadata: {
      hasMedia: false,
      hasLinks: false,
    },
  });

  // If metrics provided, create metrics record
  if (metrics) {
    const { Metrics } = await import('@/lib/db/models');
    await Metrics.create({
      postId: post._id,
      metrics,
      recordedAt: new Date(),
    });
  }

  // Create notification for admin if pending
  if (post.status === 'pending') {
    const { Notification } = await import('@/lib/db/models');
    await Notification.create({
      recipientId: project.organizationId.ownerId,
      senderId: user.id,
      organizationId,
      type: 'post_submitted',
      priority: 'normal',
      title: 'New Post Pending Approval',
      message: `${currentUser.name} submitted a new post for ${project.name}`,
      status: 'unread',
      relatedEntity: {
        type: 'post',
        id: post._id,
      },
      metadata: {
        postId: post._id,
        projectId: project._id,
        creatorId: user.id,
        postUrl,
      },
    });
  }

  logger.info(
    { postId: post._id.toString(), creatorId: user.id, projectId },
    'Post created'
  );

  return NextResponse.json({
    success: true,
    data: post,
  });
}));
