import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Post } from '@/lib/db/models';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('post-detail-api');

export async function GET(
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
      .populate('creatorId', 'name email twitterHandle')
      .populate('projectId', 'name organizationId')
      .lean();

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify access
    const { Organization } = await import('@/lib/db/models');
    type PopulatedPost = { projectId: { organizationId: unknown }; creatorId: { _id: { toString(): string } } };
    const organization = await Organization.findById(
      (post as unknown as PopulatedPost).projectId.organizationId
    );

    if (!organization || organization.ownerId.toString() !== session.user.id) {
      // Check if user is the creator
      if ((post as unknown as PopulatedPost).creatorId._id.toString() !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    logger.info({ postId }, 'Post fetched successfully');

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching post');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await request.json();
    const { caption, postUrl, status } = body;

    const { postId } = await params;
    const post = await Post.findById(postId).populate('projectId');

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify access (admin or creator)
    const { Organization } = await import('@/lib/db/models');
    const organization = await Organization.findById(
      post.projectId.organizationId
    );

    const isAdmin = organization && organization.ownerId.toString() === session.user.id;
    const isCreator = post.creatorId.toString() === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Only admin can change status
    if (status && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only admin can change post status' },
        { status: 403 }
      );
    }

    // Update post
    if (caption !== undefined) post.caption = caption;
    if (postUrl !== undefined) post.postUrl = postUrl;
    if (status !== undefined) post.status = status;

    await post.save();

    logger.info(
      { postId, userId: session.user.id },
      'Post updated'
    );

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error({ error }, 'Error updating post');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const post = await Post.findById(postId).populate('projectId');

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify access (only admin can delete)
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

    // Delete associated metrics
    const { Metrics } = await import('@/lib/db/models');
    await Metrics.deleteMany({ postId: post._id });

    // Delete post
    await post.deleteOne();

    logger.info(
      { postId, userId: session.user.id },
      'Post deleted'
    );

    return NextResponse.json({
      success: true,
      data: { message: 'Post deleted successfully' },
    });
  } catch (error) {
    logger.error({ error }, 'Error deleting post');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
