// src/lib/db/models/Notification.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Recipient and sender
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId; // Optional - system notifications have no sender
  organizationId: mongoose.Types.ObjectId; // For filtering
  
  // Notification details
  type: 
    | 'post_submitted'
    | 'post_approved'
    | 'post_rejected'
    | 'metrics_reminder'
    | 'metrics_updated'
    | 'milestone_reached'
    | 'admin_message'
    | 'creator_invited'
    | 'creator_joined'
    | 'project_created'
    | 'weekly_report'
    | 'system_alert';
  
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Content
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  
  // Related entities
  relatedEntity?: {
    type: 'post' | 'project' | 'creator' | 'organization' | 'metrics';
    id: mongoose.Types.ObjectId;
  };
  
  metadata: Record<string, unknown>; // Flexible data storage
  
  // Status
  status: 'unread' | 'read' | 'archived';
  readAt?: Date;
  archivedAt?: Date;
  
  // Email delivery
  emailDelivery?: {
    shouldSend: boolean;
    sent: boolean;
    sentAt?: Date;
    deliveryStatus?: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
    emailProvider?: string;
    messageId?: string;
    errorMessage?: string;
    openedAt?: Date;
    clickedAt?: Date;
  };
  
  // Push notification (future)
  pushDelivery?: {
    shouldSend: boolean;
    sent: boolean;
    sentAt?: Date;
    deviceTokens?: string[];
    deliveryStatus?: 'sent' | 'failed';
    errorMessage?: string;
  };
  
  // Grouping (for notification center)
  groupKey?: string; // e.g., "post_123_updates" to group related notifications
  groupCount?: number; // Number of notifications in this group
  
  // Expiration
  expiresAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

interface INotificationMethods {
  markAsRead(): Promise<void>;
  markAsArchived(): Promise<void>;
  sendEmail(): Promise<boolean>;
  canSendEmail(): boolean;
}

interface INotificationStatics {
  createNotification(data: Partial<INotification>): Promise<INotification>;
  markAllAsRead(recipientId: mongoose.Types.ObjectId): Promise<number>;
  getUnreadCount(recipientId: mongoose.Types.ObjectId): Promise<number>;
  cleanupExpired(): Promise<number>;
}

type NotificationModel = Model<INotification, Record<string, never>, INotificationMethods> & INotificationStatics;

const NotificationSchema = new Schema<INotification, NotificationModel, INotificationMethods>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    
    type: {
      type: String,
      enum: [
        'post_submitted',
        'post_approved',
        'post_rejected',
        'metrics_reminder',
        'metrics_updated',
        'milestone_reached',
        'admin_message',
        'creator_invited',
        'creator_joined',
        'project_created',
        'weekly_report',
        'system_alert'
      ],
      required: true,
      index: true
    },
    
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true
    },
    
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    actionText: {
      type: String,
      maxlength: 50
    },
    actionUrl: {
      type: String,
      maxlength: 500
    },
    
    relatedEntity: {
      type: {
        type: String,
        enum: ['post', 'project', 'creator', 'organization', 'metrics']
      },
      id: {
        type: Schema.Types.ObjectId
      }
    },
    
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    
    status: {
      type: String,
      enum: ['unread', 'read', 'archived'],
      default: 'unread',
      index: true
    },
    readAt: {
      type: Date
    },
    archivedAt: {
      type: Date
    },
    
    emailDelivery: {
      shouldSend: {
        type: Boolean,
        default: false
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: {
        type: Date
      },
      deliveryStatus: {
        type: String,
        enum: ['queued', 'sent', 'delivered', 'bounced', 'failed']
      },
      emailProvider: {
        type: String
      },
      messageId: {
        type: String
      },
      errorMessage: {
        type: String
      },
      openedAt: {
        type: Date
      },
      clickedAt: {
        type: Date
      }
    },
    
    pushDelivery: {
      shouldSend: {
        type: Boolean,
        default: false
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: {
        type: Date
      },
      deviceTokens: [String],
      deliveryStatus: {
        type: String,
        enum: ['sent', 'failed']
      },
      errorMessage: {
        type: String
      }
    },
    
    groupKey: {
      type: String,
      index: true
    },
    groupCount: {
      type: Number,
      default: 1
    },
    
    expiresAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'notifications'
  }
);

// Compound Indexes for efficient queries
NotificationSchema.index({ recipientId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, type: 1, status: 1 });
NotificationSchema.index({ organizationId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ groupKey: 1, recipientId: 1 });
NotificationSchema.index({ 'emailDelivery.sent': 1, 'emailDelivery.shouldSend': 1 });
NotificationSchema.index({ expiresAt: 1 }, { 
  expireAfterSeconds: 0,  // Auto-delete expired notifications
  partialFilterExpression: { expiresAt: { $exists: true } }
});

// Instance Methods
NotificationSchema.methods.markAsRead = async function(): Promise<void> {
  if (this.status === 'unread') {
    this.status = 'read';
    this.readAt = new Date();
    await this.save();
  }
};

NotificationSchema.methods.markAsArchived = async function(): Promise<void> {
  this.status = 'archived';
  this.archivedAt = new Date();
  await this.save();
};

NotificationSchema.methods.sendEmail = async function(): Promise<boolean> {
  if (!this.canSendEmail()) {
    return false;
  }
  
  try {
    // Email sending logic would go here
    // Using Resend, SendGrid, etc.
    
    this.emailDelivery = {
      shouldSend: this.emailDelivery?.shouldSend ?? false,
      sent: true,
      sentAt: new Date(),
      deliveryStatus: 'sent'
    };
    
    await this.save();
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.emailDelivery = {
      shouldSend: this.emailDelivery?.shouldSend ?? false,
      sent: false,
      deliveryStatus: 'failed',
      errorMessage
    };
    
    await this.save();
    return false;
  }
};

NotificationSchema.methods.canSendEmail = function(): boolean {
  return (
    this.emailDelivery?.shouldSend === true &&
    this.emailDelivery?.sent === false
  );
};

// Static Methods
NotificationSchema.statics.createNotification = async function(
  data: Partial<INotification>
): Promise<INotification> {
  const notification = new this(data);
  await notification.save();
  
  // Trigger real-time update via change stream
  // Send email if needed
  if (notification.canSendEmail()) {
    await notification.sendEmail();
  }
  
  return notification;
};

NotificationSchema.statics.markAllAsRead = async function(
  recipientId: mongoose.Types.ObjectId
): Promise<number> {
  const result = await this.updateMany(
    { recipientId, status: 'unread' },
    { 
      $set: { 
        status: 'read',
        readAt: new Date()
      } 
    }
  );
  
  return result.modifiedCount;
};

NotificationSchema.statics.getUnreadCount = async function(
  recipientId: mongoose.Types.ObjectId
): Promise<number> {
  return this.countDocuments({
    recipientId,
    status: 'unread'
  });
};

NotificationSchema.statics.cleanupExpired = async function(): Promise<number> {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  
  return result.deletedCount;
};

export default mongoose.models.Notification || 
  mongoose.model<INotification, NotificationModel>('Notification', NotificationSchema);