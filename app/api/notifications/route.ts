import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/db/models/Notification';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const countOnly = searchParams.get('count') === 'true';

    // Build query
    const query: Record<string, unknown> = {
      recipientId: session.user.id,
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

    // Fetch notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('senderId', 'name email avatar')
      .lean();

    const total = await Notification.countDocuments(query);

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
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
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

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await Notification.create({
      recipientId,
      senderId: session.user.id,
      organizationId: session.user.organizationId || recipientId,
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

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
