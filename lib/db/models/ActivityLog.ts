// src/lib/db/models/ActivityLog.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Who performed the action
  userId: mongoose.Types.ObjectId;
  userEmail: string; // Denormalized for quick access
  userName: string; // Denormalized
  userRole: 'admin' | 'creator';
  
  // Organization context
  organizationId: mongoose.Types.ObjectId;
  organizationName: string; // Denormalized
  
  // Project context (if applicable)
  projectId?: mongoose.Types.ObjectId;
  projectName?: string;
  
  // Action details
  action: 
    // User actions
    | 'user_created'
    | 'user_updated'
    | 'user_deleted'
    | 'user_login'
    | 'user_logout'
    | 'user_invited'
    | 'user_accepted_invitation'
    
    // Organization actions
    | 'organization_created'
    | 'organization_updated'
    | 'organization_settings_changed'
    
    // Project actions
    | 'project_created'
    | 'project_updated'
    | 'project_deleted'
    | 'project_archived'
    
    // Post actions
    | 'post_created'
    | 'post_submitted'
    | 'post_approved'
    | 'post_rejected'
    | 'post_deleted'
    
    // Metrics actions
    | 'metrics_submitted'
    | 'metrics_updated'
    | 'metrics_bulk_import'
    
    // Creator actions
    | 'creator_invited'
    | 'creator_activated'
    | 'creator_suspended'
    | 'creator_removed'
    
    // Notification actions
    | 'notification_sent'
    | 'notification_read'
    | 'bulk_notification_sent'
    
    // Admin actions
    | 'admin_action_performed'
    | 'settings_changed'
    | 'export_generated';
  
  // Entity affected
  entityType: 'user' | 'organization' | 'project' | 'post' | 'metrics' | 'invitation' | 'notification';
  entityId: mongoose.Types.ObjectId;
  entityName?: string;
  
  // Action details
  description: string;
  
  // Before/After state (for updates)
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  
  // Additional context
  metadata: {
    source?: 'web' | 'api' | 'mobile' | 'cron' | 'system';
    method?: string; // API method if applicable
    endpoint?: string; // API endpoint if applicable
    duration?: number; // Action duration in ms
    success: boolean;
    errorMessage?: string;
    
    // Bulk operations
    bulkOperation?: {
      isBulk: boolean;
      totalCount: number;
      successCount: number;
      failedCount: number;
    };
  };
  
  // Request details
  request?: {
    ipAddress: string;
    userAgent: string;
    browser?: string;
    os?: string;
    device?: string;
    location?: {
      country?: string;
      city?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  
  // Tags for filtering
  tags: string[];
  
  // Severity level
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  // Retention
  retentionPeriod?: number; // Days to keep this log
  expiresAt?: Date; // Auto-delete after this date
  
  createdAt: Date;
}

interface IActivityLogStatics {
  logAction(data: Partial<IActivityLog>): Promise<IActivityLog>;
  getRecentActivity(
    filters: {
      organizationId?: mongoose.Types.ObjectId;
      userId?: mongoose.Types.ObjectId;
      action?: string;
      entityType?: string;
      limit?: number;
    }
  ): Promise<IActivityLog[]>;
  cleanupOld(daysToKeep: number): Promise<number>;
}

type ActivityLogModel = Model<IActivityLog, Record<string, never>, Record<string, never>> & IActivityLogStatics;

const ActivityLogSchema = new Schema<IActivityLog, ActivityLogModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userEmail: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userRole: {
      type: String,
      enum: ['admin', 'creator'],
      required: true
    },
    
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    organizationName: {
      type: String,
      required: true
    },
    
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      index: true
    },
    projectName: {
      type: String
    },
    
    action: {
      type: String,
      required: true,
      index: true
    },
    
    entityType: {
      type: String,
      enum: ['user', 'organization', 'project', 'post', 'metrics', 'invitation', 'notification'],
      required: true,
      index: true
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    entityName: {
      type: String
    },
    
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    
    changes: [
      {
        field: { type: String, required: true },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed }
      }
    ],
    
    metadata: {
      source: {
        type: String,
        enum: ['web', 'api', 'mobile', 'cron', 'system'],
        default: 'web'
      },
      method: { type: String },
      endpoint: { type: String },
      duration: { type: Number },
      success: { type: Boolean, default: true },
      errorMessage: { type: String },
      
      bulkOperation: {
        isBulk: { type: Boolean, default: false },
        totalCount: { type: Number },
        successCount: { type: Number },
        failedCount: { type: Number }
      }
    },
    
    request: {
      ipAddress: {
        type: String,
        required: true
      },
      userAgent: { type: String },
      browser: { type: String },
      os: { type: String },
      device: { type: String },
      location: {
        country: { type: String },
        city: { type: String },
        coordinates: {
          lat: { type: Number },
          lng: { type: Number }
        }
      }
    },
    
    tags: [{ type: String, index: true }],
    
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
      index: true
    },
    
    retentionPeriod: {
      type: Number, // Days
      default: 90
    },
    expiresAt: {
      type: Date
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Activity logs don't update
    collection: 'activity_logs'
  }
);

// Compound Indexes for efficient queries
ActivityLogSchema.index({ organizationId: 1, createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ organizationId: 1, action: 1, createdAt: -1 });
ActivityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ severity: 1, createdAt: -1 });
ActivityLogSchema.index({ tags: 1, createdAt: -1 });
ActivityLogSchema.index({ 'metadata.success': 1, severity: 1 });

// TTL Index for automatic cleanup
ActivityLogSchema.index({ expiresAt: 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { expiresAt: { $exists: true } }
});

// Pre-save hook to set expiration
ActivityLogSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt && this.retentionPeriod) {
    this.expiresAt = new Date(
      Date.now() + this.retentionPeriod * 24 * 60 * 60 * 1000
    );
  }
  next();
});

// Static Methods
ActivityLogSchema.statics.logAction = async function(
  data: Partial<IActivityLog>
): Promise<IActivityLog> {
  const log = new this(data);
  
  // Auto-populate user info if userId provided
  if (data.userId && !data.userEmail) {
    const User = mongoose.model('User');
    const user = await User.findById(data.userId).select('email name role');
    if (user) {
      log.userEmail = user.email;
      log.userName = user.name;
      log.userRole = user.role;
    }
  }
  
  // Auto-populate organization info
  if (data.organizationId && !data.organizationName) {
    const Organization = mongoose.model('Organization');
    const org = await Organization.findById(data.organizationId).select('name');
    if (org) {
      log.organizationName = org.name;
    }
  }
  
  await log.save();
  return log;
};

ActivityLogSchema.statics.getRecentActivity = async function(
  filters: {
    organizationId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    action?: string;
    entityType?: string;
    limit?: number;
  }
): Promise<IActivityLog[]> {
  const query: Record<string, unknown> = {};
  
  if (filters.organizationId) query.organizationId = filters.organizationId;
  if (filters.userId) query.userId = filters.userId;
  if (filters.action) query.action = filters.action;
  if (filters.entityType) query.entityType = filters.entityType;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 50)
    .populate('userId', 'name email avatar')
    .lean() as unknown as Promise<IActivityLog[]>;
};

ActivityLogSchema.statics.cleanupOld = async function(
  daysToKeep: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    severity: { $ne: 'critical' } // Keep critical logs longer
  });
  
  return result.deletedCount;
};

export default mongoose.models.ActivityLog || 
  mongoose.model<IActivityLog, ActivityLogModel>('ActivityLog', ActivityLogSchema);