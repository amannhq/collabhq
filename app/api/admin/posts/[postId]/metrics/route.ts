import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import { Post, Metrics } from '@/lib/db/models';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can update metrics' },
        { status: 403 }
      );
    }

    const { postId } = await params;
    const body = await request.json();
    const { likes, retweets, replies, impressions } = body;

    // Validate input
    if (
      typeof likes !== 'number' ||
      typeof retweets !== 'number' ||
      typeof replies !== 'number' ||
      typeof impressions !== 'number'
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid metrics data' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the post
    const post = await Post.findById(postId);

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Calculate growth if there are previous metrics
    let growth = undefined;
    if (post.latestMetrics) {
      const prevLikes = post.latestMetrics.likes || 0;
      const prevRetweets = post.latestMetrics.retweets || 0;
      const prevReplies = post.latestMetrics.replies || 0;
      const prevImpressions = post.latestMetrics.impressions || 0;

      growth = {
        likesDelta: prevLikes > 0 ? ((likes - prevLikes) / prevLikes) * 100 : 0,
        retweetsDelta: prevRetweets > 0 ? ((retweets - prevRetweets) / prevRetweets) * 100 : 0,
        repliesDelta: prevReplies > 0 ? ((replies - prevReplies) / prevReplies) * 100 : 0,
        impressionsDelta: prevImpressions > 0 ? ((impressions - prevImpressions) / prevImpressions) * 100 : 0,
      };
    }

    // Update post with new metrics
    const newMetrics = {
      likes,
      retweets,
      replies,
      impressions,
      engagementRate: impressions > 0 ? ((likes + retweets + replies) / impressions) * 100 : 0,
      lastUpdatedAt: new Date(),
      updatedBy: session.user.id,
    };

    post.latestMetrics = newMetrics;
    if (growth) {
      post.growth = growth;
    }

    await post.save();

    // Create metrics history record
    await Metrics.create({
      postId: post._id,
      creatorId: post.creatorId,
      metrics: newMetrics,
      growth,
      recordedAt: new Date(),
      recordedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      metrics: newMetrics,
      growth,
    });
  } catch (error) {
    console.error('Error updating metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
