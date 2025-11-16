// src/lib/db/models/Post.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId; // Denormalized for faster queries
  
  // Post details
  postUrl: string;
  tweetId: string;
  content?: string;
  postedAt?: Date;
  
  // Status
  status: 'pending' | 'approved' | 'rejected';
  isFirstPost: boolean;
  
  // Verification
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  adminNotes?: string;
  rejectionReason?: string;
  
  // Latest metrics (denormalized for quick access)
  latestMetrics: {
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
    impressions: number;
    engagementRate: number; // Calculated: (likes + retweets + replies) / impressions * 100
    bookmarks?: number;
    views?: number;
    lastUpdatedAt: Date;
    updatedBy: mongoose.Types.ObjectId; // Who updated (creator or admin)
  };
  
  // Growth tracking (since last update)
  growth: {
    likesDelta: number;
    retweetsDelta: number;
    repliesDelta: number;
    impressionsDelta: number;
    engagementRateDelta: number;
  };
  
  // Reminder tracking
  reminders: {
    lastSent?: Date;
    nextDue?: Date;
    sentCount: number;
    reminderFrequency: number; // hours (from project settings)
  };
  
  // Metadata
  metadata: {
    hasMedia: boolean;
    mediaType?: 'image' | 'video' | 'gif';
    mediaCount?: number;
    hasLinks: boolean;
    linkCount?: number;
    hashtagCount?: number;
    mentionCount?: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    projectId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Project',
      required: true,
      index: true
    },
    creatorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true
    },
    organizationId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Organization',
      required: true,
      index: true
    },
    
    postUrl: { 
      type: String, 
      required: true
    },
    tweetId: { 
      type: String, 
      required: true,
      unique: true,
      index: true
    },
    content: { 
      type: String,
      maxlength: 2000
    },
    postedAt: { type: Date },
    
    status: { 
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    isFirstPost: { 
      type: Boolean, 
      default: false 
    },
    
    verifiedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User'
    },
    verifiedAt: { type: Date },
    adminNotes: { type: String, maxlength: 500 },
    rejectionReason: { type: String, maxlength: 500 },
    
    latestMetrics: {
      likes: { type: Number, default: 0, min: 0 },
      retweets: { type: Number, default: 0, min: 0 },
      replies: { type: Number, default: 0, min: 0 },
      quotes: { type: Number, default: 0, min: 0 },
      impressions: { type: Number, default: 0, min: 0 },
      engagementRate: { type: Number, default: 0, min: 0 },
      bookmarks: { type: Number, default: 0, min: 0 },
      views: { type: Number, default: 0, min: 0 },
      lastUpdatedAt: { type: Date, default: Date.now },
      updatedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User'
      }
    },
    
    growth: {
      likesDelta: { type: Number, default: 0 },
      retweetsDelta: { type: Number, default: 0 },
      repliesDelta: { type: Number, default: 0 },
      impressionsDelta: { type: Number, default: 0 },
      engagementRateDelta: { type: Number, default: 0 }
    },
    
    reminders: {
      lastSent: { type: Date },
      nextDue: { type: Date },
      sentCount: { type: Number, default: 0 },
      reminderFrequency: { type: Number, default: 24 }
    },
    
    metadata: {
      hasMedia: { type: Boolean, default: false },
      mediaType: { 
        type: String, 
        enum: ['image', 'video', 'gif']
      },
      mediaCount: { type: Number, default: 0 },
      hasLinks: { type: Boolean, default: false },
      linkCount: { type: Number, default: 0 },
      hashtagCount: { type: Number, default: 0 },
      mentionCount: { type: Number, default: 0 }
    }
  },
  { 
    timestamps: true,
    collection: 'posts'
  }
);

// Compound indexes for efficient queries
PostSchema.index({ projectId: 1, status: 1, createdAt: -1 });
PostSchema.index({ creatorId: 1, status: 1, createdAt: -1 });
PostSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
PostSchema.index({ status: 1, 'reminders.nextDue': 1 }); // For reminder jobs
PostSchema.index({ 'latestMetrics.engagementRate': -1 }); // For sorting by performance
PostSchema.index({ 'latestMetrics.lastUpdatedAt': -1 });

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);