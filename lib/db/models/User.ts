// src/lib/db/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  avatar?: string;
  role: 'saas-admin' | 'admin' | 'creator';
  
  // For SaaS Admin (you)
  isSaasAdmin?: boolean;
  
  // For Admins (Organizations)
  organizationId?: mongoose.Types.ObjectId;
  
  // For Creators
  creatorProfile?: {
    twitterHandle: string;
    twitterUserId?: string;
    twitterDisplayName?: string;
    twitterAvatar?: string;
    bio?: string;
    projectId: mongoose.Types.ObjectId;
    status: 'invited' | 'active' | 'suspended' | 'inactive';
    invitedBy: mongoose.Types.ObjectId;
    invitedAt: Date;
    activatedAt?: Date;
    
    // Performance stats (cached for quick access)
    stats: {
      totalPosts: number;
      approvedPosts: number;
      pendingPosts: number;
      totalLikes: number;
      totalRetweets: number;
      totalImpressions: number;
      avgEngagementRate: number;
      lastPostDate?: Date;
      lastMetricUpdate?: Date;
    };
  };
  
  // Auth fields (Better Auth stores some here)
  emailVerified: boolean;
  lastLoginAt?: Date;
  loginCount: number;
  
  // Preferences
  preferences: {
    emailNotifications: boolean;
    reminderFrequency: number; // hours
    language: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { 
      type: String, 
      required: true,
      lowercase: true,
      trim: true
    },
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    avatar: { type: String },
    role: { 
      type: String, 
      enum: ['saas-admin', 'admin', 'creator'],
      required: true,
      default: 'admin'
    },
    
    isSaasAdmin: { type: Boolean, default: false },
    
    organizationId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Organization'
    },
    
    creatorProfile: {
      twitterHandle: { 
        type: String,
        trim: true,
        match: /^@?[\w]+$/
      },
      twitterUserId: { type: String },
      twitterDisplayName: { type: String },
      twitterAvatar: { type: String },
      bio: { type: String, maxlength: 500 },
      projectId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Project'
      },
      status: { 
        type: String,
        enum: ['invited', 'active', 'suspended', 'inactive'],
        default: 'invited'
      },
      invitedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User'
      },
      invitedAt: { type: Date },
      activatedAt: { type: Date },
      
      stats: {
        totalPosts: { type: Number, default: 0 },
        approvedPosts: { type: Number, default: 0 },
        pendingPosts: { type: Number, default: 0 },
        totalLikes: { type: Number, default: 0 },
        totalRetweets: { type: Number, default: 0 },
        totalImpressions: { type: Number, default: 0 },
        avgEngagementRate: { type: Number, default: 0 },
        lastPostDate: { type: Date },
        lastMetricUpdate: { type: Date }
      }
    },
    
    emailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
    
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      reminderFrequency: { type: Number, default: 24 }, // hours
      language: { type: String, default: 'en' }
    }
  },
  { 
    timestamps: true,
    collection: 'users'
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ organizationId: 1, role: 1 });
UserSchema.index({ 'creatorProfile.projectId': 1 });
UserSchema.index({ 'creatorProfile.status': 1 });
UserSchema.index({ 'creatorProfile.twitterHandle': 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);