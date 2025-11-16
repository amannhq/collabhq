// src/types/activity.ts

import { ObjectId, ActivityAction, Severity, RequestMetadata } from './index';

export interface ActivityChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface BulkOperation {
  isBulk: boolean;
  totalCount: number;
  successCount: number;
  failedCount: number;
}

export interface ActivityMetadata {
  source?: 'web' | 'api' | 'mobile' | 'cron' | 'system';
  method?: string;
  endpoint?: string;
  duration?: number;
  success: boolean;
  errorMessage?: string;
  bulkOperation?: BulkOperation;
}

export interface ActivityLog {
  _id: ObjectId;
  userId: ObjectId;
  userEmail: string;
  userName: string;
  userRole: 'admin' | 'creator';
  organizationId: ObjectId;
  organizationName: string;
  projectId?: ObjectId;
  projectName?: string;
  action: ActivityAction;
  entityType: 'user' | 'organization' | 'project' | 'post' | 'metrics' | 'invitation' | 'notification';
  entityId: ObjectId;
  entityName?: string;
  description: string;
  changes?: ActivityChange[];
  metadata: ActivityMetadata;
  request?: RequestMetadata;
  tags: string[];
  severity: Severity;
  retentionPeriod?: number;
  expiresAt?: Date;
  createdAt: Date;
}

// DTOs
export interface LogActivityDto {
  userId: ObjectId;
  organizationId: ObjectId;
  projectId?: ObjectId;
  action: ActivityAction;
  entityType: string;
  entityId: ObjectId;
  entityName?: string;
  description: string;
  changes?: ActivityChange[];
  metadata?: Partial<ActivityMetadata>;
  request?: Partial<RequestMetadata>;
  tags?: string[];
  severity?: Severity;
}

export interface ActivityFilters {
  userId?: ObjectId;
  organizationId?: ObjectId;
  projectId?: ObjectId;
  action?: ActivityAction;
  entityType?: string;
  severity?: Severity;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
}

export interface ActivityLogWithUser extends ActivityLog {
  user: {
    _id: ObjectId;
    name: string;
    email: string;
    avatar?: string;
  };
}