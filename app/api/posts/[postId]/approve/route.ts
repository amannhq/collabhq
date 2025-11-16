import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Post, Notification } from '@/lib/db/models';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('posts-approve-api');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
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

    const { postId } = await params;
    const post = await Post.findById(postId)
      .populate('projectId')
      .populate('creatorId');

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user owns the organization
    const { Organization } = await import('@/lib/db/models');
    const organization = await Organization.findById(
      post.projectId.organizationId
    );

    if (!organization || organization.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update post status
    post.status = 'approved';
    post.approvedAt = new Date();
    post.approvedBy = session.user.id;
    await post.save();

    // Create notification for creator
    await Notification.create({
      recipientId: post.creatorId._id,
      senderId: session.user.id,
      organizationId: post.projectId.organizationId,
      type: 'post_approved',
      priority: 'normal',
      title: 'Post Approved',
      message: `Your post for ${post.projectId.name} has been approved`,
      status: 'unread',
      relatedEntity: {
        type: 'post',
        id: post._id,
      },
      metadata: {
        postId: post._id,
        projectId: post.projectId._id,
        postUrl: post.postUrl,
      },
    });

    logger.info(
      {
        postId: post._id.toString(),
        userId: session.user.id,
        creatorId: post.creatorId._id.toString(),
      },
      'Post approved'
    );

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error({ error }, 'Error approving post');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
