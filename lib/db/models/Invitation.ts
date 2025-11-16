// src/lib/db/models/Invitation.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface IInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Recipient information
  email: string;
  token: string; // Unique token for magic link
  
  // Organization and project context
  organizationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  
  // Creator information
  creatorData: {
    name: string;
    twitterHandle: string;
    role: string;
    customMessage?: string;
  };
  
  // Status tracking
  status: 'pending' | 'accepted' | 'expired' | 'cancelled' | 'bounced';
  
  // Timing
  sentAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  
  // Delivery tracking
  emailDelivery: {
    sent: boolean;
    sentAt?: Date;
    deliveryStatus?: 'delivered' | 'bounced' | 'failed';
    opens: number;
    lastOpenedAt?: Date;
    clicks: number;
    lastClickedAt?: Date;
    emailProvider?: string; // 'resend', 'sendgrid', etc.
    messageId?: string;
    errorMessage?: string;
  };
  
  // Usage tracking
  accessLog: Array<{
    accessedAt: Date;
    ipAddress: string;
    userAgent: string;
    action: 'viewed' | 'clicked' | 'accepted';
  }>;
  
  // Metadata
  metadata: {
    inviteType: 'email' | 'link' | 'bulk';
    source: 'dashboard' | 'api' | 'csv_import';
    reminderCount: number;
    lastReminderSent?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

interface IInvitationMethods {
  generateToken(): string;
  isExpired(): boolean;
  canResend(): boolean;
  markAsAccepted(userId: mongoose.Types.ObjectId): Promise<void>;
  sendReminder(): Promise<void>;
  logAccess(ipAddress: string, userAgent: string, action: string): Promise<void>;
}

interface IInvitationStatics {
  generateUniqueToken(): Promise<string>;
  findByToken(token: string): Promise<IInvitation | null>;
  cleanupExpired(): Promise<number>;
}

type InvitationModel = Model<IInvitation, Record<string, never>, IInvitationMethods> & IInvitationStatics;

const InvitationSchema = new Schema<IInvitation, InvitationModel, IInvitationMethods>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    token: {
      type: String,
      required: true
    },
    
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    creatorData: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      twitterHandle: {
        type: String,
        required: true,
        trim: true,
        match: /^@?[\w]+$/
      },
      role: {
        type: String,
        default: 'creator'
      },
      customMessage: {
        type: String,
        maxlength: 500
      }
    },
    
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'cancelled', 'bounced'],
      default: 'pending',
      index: true
    },
    
    sentAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    acceptedAt: {
      type: Date
    },
    
    emailDelivery: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: {
        type: Date
      },
      deliveryStatus: {
        type: String,
        enum: ['delivered', 'bounced', 'failed']
      },
      opens: {
        type: Number,
        default: 0
      },
      lastOpenedAt: {
        type: Date
      },
      clicks: {
        type: Number,
        default: 0
      },
      lastClickedAt: {
        type: Date
      },
      emailProvider: {
        type: String
      },
      messageId: {
        type: String
      },
      errorMessage: {
        type: String
      }
    },
    
    accessLog: [
      {
        accessedAt: {
          type: Date,
          default: Date.now
        },
        ipAddress: {
          type: String,
          required: true
        },
        userAgent: {
          type: String
        },
        action: {
          type: String,
          enum: ['viewed', 'clicked', 'accepted'],
          required: true
        }
      }
    ],
    
    metadata: {
      inviteType: {
        type: String,
        enum: ['email', 'link', 'bulk'],
        default: 'email'
      },
      source: {
        type: String,
        enum: ['dashboard', 'api', 'csv_import'],
        default: 'dashboard'
      },
      reminderCount: {
        type: Number,
        default: 0
      },
      lastReminderSent: {
        type: Date
      }
    }
  },
  {
    timestamps: true,
    collection: 'invitations'
  }
);

// Indexes
InvitationSchema.index({ token: 1 }, { unique: true });
InvitationSchema.index({ email: 1, status: 1 });
InvitationSchema.index({ organizationId: 1, status: 1 });
InvitationSchema.index({ projectId: 1, status: 1 });
InvitationSchema.index({ status: 1, expiresAt: 1 }); // For cleanup jobs
InvitationSchema.index({ 'emailDelivery.sent': 1, sentAt: -1 });
InvitationSchema.index({ createdAt: -1 });

// Instance Methods
InvitationSchema.methods.generateToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.token = token;
  return token;
};

InvitationSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

InvitationSchema.methods.canResend = function(): boolean {
  // Can resend if:
  // 1. Status is pending
  // 2. Not expired
  // 3. Last reminder was sent more than 24 hours ago (or never sent)
  if (this.status !== 'pending' || this.isExpired()) {
    return false;
  }
  
  if (!this.metadata.lastReminderSent) {
    return true;
  }
  
  const hoursSinceLastReminder = 
    (Date.now() - this.metadata.lastReminderSent.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastReminder >= 24;
};

InvitationSchema.methods.markAsAccepted = async function(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: mongoose.Types.ObjectId
): Promise<void> {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  
  // Log acceptance
  this.accessLog.push({
    accessedAt: new Date(),
    ipAddress: 'system',
    userAgent: 'system',
    action: 'accepted'
  });
  
  await this.save();
};

InvitationSchema.methods.sendReminder = async function(): Promise<void> {
  this.metadata.reminderCount += 1;
  this.metadata.lastReminderSent = new Date();
  await this.save();
};

InvitationSchema.methods.logAccess = async function(
  ipAddress: string,
  userAgent: string,
  action: string
): Promise<void> {
  this.accessLog.push({
    accessedAt: new Date(),
    ipAddress,
    userAgent,
    action: action as 'viewed' | 'clicked' | 'accepted'
  });
  
  // Update email tracking
  if (action === 'viewed' || action === 'clicked') {
    if (action === 'viewed') {
      this.emailDelivery.opens += 1;
      this.emailDelivery.lastOpenedAt = new Date();
    } else if (action === 'clicked') {
      this.emailDelivery.clicks += 1;
      this.emailDelivery.lastClickedAt = new Date();
    }
  }
  
  await this.save();
};

// Static Methods
InvitationSchema.statics.generateUniqueToken = async function(): Promise<string> {
  let token: string;
  let exists: boolean;
  
  do {
    token = crypto.randomBytes(32).toString('hex');
    exists = !!(await this.exists({ token }));
  } while (exists);
  
  return token;
};

InvitationSchema.statics.findByToken = async function(
  token: string
): Promise<IInvitation | null> {
  return this.findOne({ token, status: 'pending' })
    .populate('organizationId')
    .populate('projectId')
    .populate('invitedBy');
};

InvitationSchema.statics.cleanupExpired = async function(): Promise<number> {
  const result = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  
  return result.modifiedCount;
};

// Pre-save hook to set expiration if not set
InvitationSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    // Default: 7 days expiration
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

export default mongoose.models.Invitation || 
  mongoose.model<IInvitation, InvitationModel>('Invitation', InvitationSchema);