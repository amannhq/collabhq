import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/db/models/Notification';
import { withErrorHandler, BadRequestError } from '@/lib/api/error-handler';
import { withAuth } from '@/lib/api/auth-middleware';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('notifications-api');

export const GET = withErrorHandler(withAuth(async (request: NextRequest, { user }) => {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const countOnly = searchParams.get('count') === 'true';

  // Build query
  const query: Record<string, unknown> = {
    recipientId: user.id,
  };

  if (status) {
    query.status = status;
  }

  if (type) {
    query.type = type;
  }

  // If only count is requested
  if (countOnly) {
    const count = await Notification.countDocuments(query);
    return NextResponse.json({
      success: true,
      data: { count },
    });
  }

  // OPTIMIZED: Fetch notifications with pagination using parallel queries
  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .select('type priority title message actionText actionUrl relatedEntity status createdAt readAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('senderId', 'name email avatar')
      .lean(),
    Notification.countDocuments(query),
  ]);

  logger.info(
    { userId: user.id, total, limit, skip },
    'Notifications fetched'
  );

  return NextResponse.json({
    success: true,
    data: {
      notifications,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit,
      },
    },
  });
}));

export const POST = withErrorHandler(withAuth(async (request: NextRequest, { user }) => {
  await connectDB();

  const body = await request.json();
  const {
    recipientId,
    type,
    priority = 'normal',
    title,
    message,
    actionText,
    actionUrl,
    relatedEntity,
    metadata = {},
    shouldSendEmail = false,
  } = body;

  // Validate required fields
  if (!recipientId || !type || !title || !message) {
    throw BadRequestError('Missing required fields: recipientId, type, title, message');
  }

  // Create notification
  const notification = await Notification.create({
    recipientId,
    senderId: user.id,
    organizationId: user.organizationId || recipientId,
    type,
    priority,
    title,
    message,
    actionText,
    actionUrl,
    relatedEntity,
    metadata,
    emailDelivery: shouldSendEmail
      ? {
          shouldSend: true,
          sent: false,
        }
      : undefined,
  });

  logger.info(
    { notificationId: notification._id, recipientId, type },
    'Notification created'
  );

  return NextResponse.json({
    success: true,
    data: notification,
  });
}));
