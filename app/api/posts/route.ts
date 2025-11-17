import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { Post, Project } from '@/lib/db/models';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('posts-api');

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const creatorId = searchParams.get('creatorId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // Verify user has access to organization
    const { Organization } = await import('@/lib/db/models');
    const organization = await Organization.findById(organizationId);

    if (!organization || organization.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
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

    // Build query scoped to organization
    const query: Record<string, unknown> = {
      organizationId: orgObjectId,
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (projectId) {
      if (!Types.ObjectId.isValid(projectId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid project ID' },
          { status: 400 }
        );
      }
      query.projectId = new Types.ObjectId(projectId);
    }

    if (creatorId) {
      if (!Types.ObjectId.isValid(creatorId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid creator ID' },
          { status: 400 }
        );
      }
      query.creatorId = new Types.ObjectId(creatorId);
    }

    if (search) {
      query.$or = [
        { postUrl: { $regex: search, $options: 'i' } },
        { caption: { $regex: search, $options: 'i' } },
      ];
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      Post.find(query)
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

    return NextResponse.json({
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
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching posts');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, postUrl, caption, metrics } = body;

    if (!projectId || !postUrl) {
      return NextResponse.json(
        { success: false, error: 'Project ID and post URL required' },
        { status: 400 }
      );
    }

    // Get project and verify access
    const project = await Project.findById(projectId).populate('organizationId');

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is creator in this project or admin
    const { User } = await import('@/lib/db/models');
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const isCreator = user.creatorProfile?.projectId?.toString() === projectId;
    const isAdmin = project.organizationId.ownerId.toString() === session.user.id;

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Extract tweet ID from URL (handles query parameters like ?s=20, ?t=xxx&s=19, etc.)
    // Twitter/X tweet IDs are 19 digits long
    const tweetIdMatch = postUrl.match(/\/status\/(\d{10,20})(?:[/?#&]|$)/);
    if (!tweetIdMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid Twitter/X post URL. URL must contain /status/{tweet_id}' },
        { status: 400 }
      );
    }
    const tweetId = tweetIdMatch[1];

    // Get organization ID from project
    const organizationId = project.organizationId._id || project.organizationId;

    // Create post
    const post = await Post.create({
      projectId,
      creatorId: session.user.id,
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
        updatedBy: session.user.id,
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
        senderId: session.user.id,
        organizationId,
        type: 'post_submitted',
        priority: 'normal',
        title: 'New Post Pending Approval',
        message: `${user.name} submitted a new post for ${project.name}`,
        status: 'unread',
        relatedEntity: {
          type: 'post',
          id: post._id,
        },
        metadata: {
          postId: post._id,
          projectId: project._id,
          creatorId: session.user.id,
          postUrl,
        },
      });
    }

    logger.info(
      { postId: post._id.toString(), creatorId: session.user.id, projectId },
      'Post created'
    );

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error({ error }, 'Error creating post');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
