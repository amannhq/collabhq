import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Post } from '@/lib/db/models';
import { createLogger } from '@/lib/utils/logger';
import { PostUpdateSchema, ObjectIdSchema } from '@/lib/api/validation';
import { withErrorHandler, NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/error-handler';
import { withAuth } from '@/lib/api/auth-middleware';

const logger = createLogger('post-detail-api');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  return withErrorHandler(withAuth(async (_req, { user }) => {
    await connectDB();

    const { postId } = await params;

    // Validate postId is a valid ObjectId
    try {
      ObjectIdSchema.parse(postId);
    } catch {
      throw BadRequestError('Invalid post ID format');
    }

    const post = await Post.findById(postId)
      .populate('creatorId', 'name email twitterHandle')
      .populate('projectId', 'name organizationId')
      .lean();

    if (!post) {
      throw NotFoundError('Post');
    }

    // Verify access
    const { Organization } = await import('@/lib/db/models');
    type PopulatedPost = { projectId: { organizationId: unknown }; creatorId: { _id: { toString(): string } } };
    const organization = await Organization.findById(
      (post as unknown as PopulatedPost).projectId.organizationId
    );

    if (!organization || organization.ownerId.toString() !== user.id) {
      // Check if user is the creator
      if ((post as unknown as PopulatedPost).creatorId._id.toString() !== user.id) {
        throw ForbiddenError('You do not have access to this post');
      }
    }

    logger.info({ postId }, 'Post fetched successfully');

    return NextResponse.json({
      success: true,
      data: post,
    });
  }))(request, undefined);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  return withErrorHandler(withAuth(async (_req, { user }) => {
    await connectDB();

    // Validate request body with Zod
    const body = await request.json();
    const validatedData = PostUpdateSchema.parse(body);
    const { caption, status } = validatedData;

    const { postId } = await params;

    // Validate postId is a valid ObjectId
    try {
      ObjectIdSchema.parse(postId);
    } catch {
      throw BadRequestError('Invalid post ID format');
    }

    const post = await Post.findById(postId).populate('projectId');

    if (!post) {
      throw NotFoundError('Post');
    }

    // Verify access (admin or creator)
    const { Organization } = await import('@/lib/db/models');
    const organization = await Organization.findById(
      post.projectId.organizationId
    );

    const isAdmin = organization && organization.ownerId.toString() === user.id;
    const isCreator = post.creatorId.toString() === user.id;

    if (!isAdmin && !isCreator) {
      throw ForbiddenError('You do not have permission to update this post');
    }

    // Only admin can change status
    if (status && !isAdmin) {
      throw ForbiddenError('Only admin can change post status');
    }

    // Update post (validated data only)
    if (caption !== undefined) post.caption = caption;
    if (status !== undefined) post.status = status;

    await post.save();

    logger.info(
      { postId, userId: user.id },
      'Post updated'
    );

    return NextResponse.json({
      success: true,
      data: post,
    });
  }))(request, undefined);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  return withErrorHandler(withAuth(async (_req, { user }) => {
    await connectDB();

    const { postId } = await params;

    // Validate postId is a valid ObjectId
    try {
      ObjectIdSchema.parse(postId);
    } catch {
      throw BadRequestError('Invalid post ID format');
    }

    const post = await Post.findById(postId).populate('projectId');

    if (!post) {
      throw NotFoundError('Post');
    }

    // Verify access (only admin can delete)
    const { Organization } = await import('@/lib/db/models');
    const organization = await Organization.findById(
      post.projectId.organizationId
    );

    if (!organization || organization.ownerId.toString() !== user.id) {
      throw ForbiddenError('Only organization admins can delete posts');
    }

    // Delete associated metrics
    const { Metrics } = await import('@/lib/db/models');
    await Metrics.deleteMany({ postId: post._id });

    // Delete post
    await post.deleteOne();

    logger.info(
      { postId, userId: user.id },
      'Post deleted'
    );

    return NextResponse.json({
      success: true,
      data: { message: 'Post deleted successfully' },
    });
  }))(request, undefined);
}
