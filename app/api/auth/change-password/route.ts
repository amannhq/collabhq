import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ensureDbConnection } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models';
import { auth } from '@/lib/auth/betterauth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('change-password-api');

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid request payload' },
        { status: 400 }
      );
    }

    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : undefined;
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : undefined;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must contain uppercase, lowercase, and number',
        },
        { status: 400 }
      );
    }

    // Use Better Auth's change password API
    const result = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: false, // Keep user logged in
      },
      headers: request.headers,
    });

    if (!result || (typeof result === 'object' && 'success' in result && !result.success)) {
      return NextResponse.json(
        { success: false, error: 'Failed to change password. Please check your current password.' },
        { status: 400 }
      );
    }

    await ensureDbConnection();
    await User.findByIdAndUpdate(session.user.id, {
      requirePasswordChange: false,
    });

    logger.info(
      { userId: session.user.id },
      'User password changed successfully'
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error changing password');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
