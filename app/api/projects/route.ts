import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Project, Organization, type IOrganization } from '@/lib/db/models';
import { createLogger } from '@/lib/utils/logger';
import { validateSearchParams, ProjectCreateSchema, ProjectsQuerySchema } from '@/lib/api/validation';
import { withErrorHandler, NotFoundError, ForbiddenError } from '@/lib/api/error-handler';
import { withAuth } from '@/lib/api/auth-middleware';

const logger = createLogger('projects-api');

export const POST = withErrorHandler(withAuth(async (request: NextRequest, { user }) => {
  await connectDB();

  // Validate request body with Zod (HOF handles Zod errors automatically)
  const body = await request.json();
  const validatedData = ProjectCreateSchema.parse(body);

  const {
    name,
    description,
    status,
    organizationId,
    requirePostApproval,
    metricUpdateFrequency,
    autoReminders,
  } = validatedData;

  // Verify organization access
  const organization = await Organization.findById(organizationId).lean<IOrganization>();

  if (!organization) {
    throw NotFoundError('Organization');
  }

  if (organization.ownerId.toString() !== user.id) {
    throw ForbiddenError('You do not own this organization');
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
    createdBy: user.id,
  });

  logger.info({ projectId: project._id, orgId: organizationId, userId: user.id }, 'Project created');

  return NextResponse.json({
    success: true,
    data: project,
  });
}));

export const GET = withErrorHandler(withAuth(async (request: NextRequest, { user }) => {
  await connectDB();

  const { searchParams } = new URL(request.url);

  // Validate search params with Zod
  const validation = validateSearchParams(ProjectsQuerySchema, searchParams);
  if (!validation.success) {
    return validation.error;
  }

  const { organizationId, orgId, status } = validation.data;
  const finalOrgId = organizationId || orgId;

  // Verify organization access
  const organization = await Organization.findById(finalOrgId).lean<IOrganization>();

  if (!organization) {
    throw NotFoundError('Organization');
  }

  if (organization.ownerId.toString() !== user.id) {
    throw ForbiddenError('You do not have access to this organization');
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

  logger.info({ orgId: finalOrgId, count: formattedProjects.length }, 'Fetched projects');

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
}));
