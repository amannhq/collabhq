import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Organization from '@/lib/db/models/Organization';
import { validateSearchParams, OrganizationQuerySchema } from '@/lib/api/validation';
import { withErrorHandler, NotFoundError, ForbiddenError } from '@/lib/api/error-handler';
import { withAuth } from '@/lib/api/auth-middleware';

export const GET = withErrorHandler(withAuth(async (request: NextRequest, { user }) => {
  await connectDB();

  const { searchParams } = new URL(request.url);

  // Validate search params with Zod
  const validation = validateSearchParams(OrganizationQuerySchema, searchParams);
  if (!validation.success) {
    return validation.error;
  }

  const { slug, id: orgId } = validation.data;

  // Find organization by slug or ID
  const query = slug ? { slug } : { _id: orgId };
  const organization = await Organization.findOne(query).lean() as { ownerId: { toString(): string }; _id: { toString(): string } } | null;

  if (!organization) {
    throw NotFoundError('Organization');
  }

  // Verify user has access (owner)
  if (organization.ownerId.toString() !== user.id) {
    throw ForbiddenError('You do not have access to this organization');
  }

  return NextResponse.json({
    success: true,
    data: organization,
  });
}));
