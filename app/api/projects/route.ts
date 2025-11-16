import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Project, Organization, type IOrganization } from '@/lib/db/models';
import { requireAuth } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('projects-api');

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await requireAuth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      status,
      organizationId,
      requirePostApproval,
      metricUpdateFrequency,
      autoReminders,
    } = body;

    // Verify organization access
    const organization = await Organization.findById(organizationId).lean<IOrganization>();
    
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (organization.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Create project
    const project = await Project.create({
      name,
      description,
      status: status || 'active',
      organizationId,
      settings: {
        requirePostApproval: requirePostApproval !== undefined ? requirePostApproval : true,
        metricUpdateFrequency: metricUpdateFrequency || 24,
        autoReminders: autoReminders !== undefined ? autoReminders : true,
      },
      createdBy: session.user.id,
    });

    logger.info({ projectId: project._id, orgId: organizationId, userId: session.user.id }, 'Project created');

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    logger.error({ error }, 'Error creating project');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const organizationId = searchParams.get('organizationId') || searchParams.get('orgId');
    const status = searchParams.get('status');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // Verify organization access
    const organization = await Organization.findById(organizationId).lean<IOrganization>();
    
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (organization.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get projects with aggregated stats
    const matchStage: Record<string, unknown> = { organizationId: organization._id };
    if (status) {
      matchStage.status = status;
    }

    const projects = await Project.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$creatorProfile.projectId', '$$projectId']
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'creatorStats'
        }
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'projectId',
          as: 'posts'
        }
      },
      {
        $addFields: {
          creatorCount: { $ifNull: [{ $arrayElemAt: ['$creatorStats.count', 0] }, 0] },
          postCount: { $size: '$posts' }
        }
      },
      { $project: { posts: 0, creatorStats: 0 } },
      { $sort: { createdAt: -1 } }
    ]);

    const formattedProjects = projects.map((p) => ({
      _id: p._id.toString(),
      organizationId: p.organizationId.toString(),
      name: p.name,
      description: p.description,
      status: p.status,
      settings: p.settings,
      stats: p.stats,
      createdBy: p.createdBy.toString(),
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
      creatorCount: p.creatorCount || 0,
      postCount: p.postCount || 0,
    }));

    logger.info({ orgId: organizationId, count: formattedProjects.length }, 'Fetched projects');

    return NextResponse.json(
      {
        success: true,
        data: formattedProjects,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40',
        },
      }
    );
  } catch (error) {
    logger.error({ error }, 'Error fetching projects');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
