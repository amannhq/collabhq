// src/lib/db/models/Project.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  
  settings: {
    requirePostApproval: boolean;
    firstPostRequiresApproval: boolean;
    metricUpdateFrequency: number; // hours
    autoReminders: boolean;
    reminderTime: string; // "09:00" format
  };
  
  // Cached stats for quick access
  stats: {
    totalCreators: number;
    activeCreators: number;
    totalPosts: number;
    approvedPosts: number;
    pendingPosts: number;
    totalEngagement: number; // likes + retweets + replies
    totalImpressions: number;
    avgEngagementRate: number;
    lastUpdated: Date;
  };
  
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    organizationId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Organization',
      required: true,
      index: true
    },
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    description: { 
      type: String,
      maxlength: 500
    },
    status: { 
      type: String,
      enum: ['active', 'paused', 'completed', 'archived'],
      default: 'active',
      index: true
    },
    
    settings: {
      requirePostApproval: { type: Boolean, default: false },
      firstPostRequiresApproval: { type: Boolean, default: true },
      metricUpdateFrequency: { type: Number, default: 24 },
      autoReminders: { type: Boolean, default: true },
      reminderTime: { type: String, default: '09:00' }
    },
    
    stats: {
      totalCreators: { type: Number, default: 0 },
      activeCreators: { type: Number, default: 0 },
      totalPosts: { type: Number, default: 0 },
      approvedPosts: { type: Number, default: 0 },
      pendingPosts: { type: Number, default: 0 },
      totalEngagement: { type: Number, default: 0 },
      totalImpressions: { type: Number, default: 0 },
      avgEngagementRate: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },
    
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    }
  },
  { 
    timestamps: true,
    collection: 'projects'
  }
);

// Indexes
ProjectSchema.index({ organizationId: 1, status: 1 });
ProjectSchema.index({ createdBy: 1 });
ProjectSchema.index({ createdAt: -1 });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);