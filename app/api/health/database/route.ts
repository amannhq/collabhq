import { NextRequest, NextResponse } from 'next/server';
import { healthCheck, getConnectionStatus } from '@/lib/db/mongodb';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('health-check');

/**
 * Database health check endpoint
 * GET /api/health/database
 */
export async function GET(request: NextRequest) {
  try {
    const health = await healthCheck();
    
    logger.info({
      healthy: health.healthy,
      latency: health.latency,
      status: health.status.readyStateText,
    }, 'Database health check performed');

    if (!health.healthy) {
      return NextResponse.json(
        {
          success: false,
          error: health.error || 'Database unhealthy',
          status: health.status,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        healthy: health.healthy,
        latency: health.latency,
        status: health.status,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        status: getConnectionStatus(),
      },
      { status: 503 }
    );
  }
}
