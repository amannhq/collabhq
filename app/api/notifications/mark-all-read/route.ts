import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/db/models/Notification';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import mongoose from 'mongoose';

export async function PATCH() {
  try {
    await connectDB();

    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mark all user's notifications as read
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const result = await Notification.updateMany(
      { recipientId: userId, status: 'unread' },
      {
        $set: {
          status: 'read',
          readAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
