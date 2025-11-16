import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Post, Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';
import { requireAuth } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('analytics-export-api');

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await requireAuth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organizationId');
    const format = searchParams.get('format') || 'csv';
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID required' },
        { status: 400 }
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

    // Build date filter
    const dateFilter: { organizationId: unknown; createdAt?: { $gte?: Date; $lte?: Date } } = { 
      organizationId: organization._id 
    };
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
      if (toDate) dateFilter.createdAt.$lte = new Date(toDate);
    }

    // Fetch all posts with populated data
    const posts = await Post.find(dateFilter)
      .populate('creatorId', 'name email twitterHandle')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'csv') {
      const csv = generateCSV(posts);
      
      logger.info(
        { orgId, userId: session.user.id, format, postsCount: posts.length },
        'Analytics exported to CSV'
      );

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // For now, return a simple text response
      // In a real app, you'd use a PDF generation library like pdfkit or puppeteer
      const content = generatePDFContent(posts, organization);
      
      logger.info(
        { orgId, userId: session.user.id, format, postsCount: posts.length },
        'Analytics exported to PDF (text format)'
      );

      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.txt"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid format' },
      { status: 400 }
    );
  } catch (error) {
    logger.error({ error }, 'Error exporting analytics');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCSV(posts: unknown[]): string {
  const headers = [
    'Post URL',
    'Creator',
    'Creator Email',
    'Project',
    'Status',
    'Likes',
    'Retweets',
    'Replies',
    'Impressions',
    'Engagement Rate',
    'Created At',
    'Published At',
  ];

  const rows = posts.map((p) => {
    const post = p as {
      postUrl?: string;
      creatorId?: { name?: string; email?: string };
      projectId?: { name?: string };
      status?: string;
      latestMetrics?: {
        likes?: number;
        retweets?: number;
        replies?: number;
        impressions?: number;
      };
      createdAt?: Date;
      publishedAt?: Date;
    };

    const creator = post.creatorId;
    const project = post.projectId;
    const metrics = post.latestMetrics || {};
    const engagementRate =
      (metrics.impressions || 0) > 0
        ? (((metrics.likes || 0) + (metrics.retweets || 0) + (metrics.replies || 0)) /
            (metrics.impressions || 1)) *
          100
        : 0;

    return [
      `"${post.postUrl || ''}"`,
      `"${creator?.name || 'N/A'}"`,
      `"${creator?.email || 'N/A'}"`,
      `"${project?.name || 'N/A'}"`,
      post.status || 'pending',
      metrics.likes || 0,
      metrics.retweets || 0,
      metrics.replies || 0,
      metrics.impressions || 0,
      engagementRate.toFixed(2),
      post.createdAt ? new Date(post.createdAt).toISOString() : '',
      post.publishedAt ? new Date(post.publishedAt).toISOString() : '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function generatePDFContent(posts: unknown[], organization: { name: string }): string {
  const typedPosts = posts as Array<{
    status?: string;
    latestMetrics?: {
      likes?: number;
      retweets?: number;
      replies?: number;
      impressions?: number;
    };
  }>;

  const totalPosts = typedPosts.length;
  const approvedPosts = typedPosts.filter((p) => p.status === 'approved').length;
  const pendingPosts = typedPosts.filter((p) => p.status === 'pending').length;
  const rejectedPosts = typedPosts.filter((p) => p.status === 'rejected').length;

  const totalLikes = typedPosts.reduce((sum, p) => sum + (p.latestMetrics?.likes || 0), 0);
  const totalRetweets = typedPosts.reduce((sum, p) => sum + (p.latestMetrics?.retweets || 0), 0);
  const totalReplies = typedPosts.reduce((sum, p) => sum + (p.latestMetrics?.replies || 0), 0);
  const totalImpressions = typedPosts.reduce(
    (sum, p) => sum + (p.latestMetrics?.impressions || 0),
    0
  );

  const avgEngagement =
    totalImpressions > 0
      ? ((totalLikes + totalRetweets + totalReplies) / totalImpressions) * 100
      : 0;

  return `
ANALYTICS REPORT
${organization.name}
Generated: ${new Date().toLocaleString()}

================================================================================

SUMMARY STATISTICS

Total Posts: ${totalPosts}
- Approved: ${approvedPosts}
- Pending: ${pendingPosts}
- Rejected: ${rejectedPosts}

ENGAGEMENT METRICS

Total Likes: ${totalLikes.toLocaleString()}
Total Retweets: ${totalRetweets.toLocaleString()}
Total Replies: ${totalReplies.toLocaleString()}
Total Impressions: ${totalImpressions.toLocaleString()}
Average Engagement Rate: ${avgEngagement.toFixed(2)}%

================================================================================

TOP POSTS BY ENGAGEMENT

${typedPosts
  .sort((a, b) => {
    const aMetrics = a.latestMetrics || {};
    const bMetrics = b.latestMetrics || {};
    const aTotal = (aMetrics.likes || 0) + (aMetrics.retweets || 0) + (aMetrics.replies || 0);
    const bTotal = (bMetrics.likes || 0) + (bMetrics.retweets || 0) + (bMetrics.replies || 0);
    return bTotal - aTotal;
  })
  .slice(0, 10)
  .map((post, index) => {
    const metrics = post.latestMetrics || {};
    return `
${index + 1}. ${(post as { postUrl?: string }).postUrl || 'N/A'}
   Creator: ${(post as { creatorId?: { name?: string } }).creatorId?.name || 'N/A'}
   Likes: ${metrics.likes || 0} | Retweets: ${metrics.retweets || 0} | Replies: ${metrics.replies || 0}
   Impressions: ${metrics.impressions || 0}
`;
  })
  .join('\n')}

================================================================================
`;
}
