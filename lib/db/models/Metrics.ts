// src/lib/db/models/Metrics.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMetrics extends Document {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId; // Denormalized
  projectId: mongoose.Types.ObjectId; // Denormalized
  organizationId: mongoose.Types.ObjectId; // Denormalized
  
  // Snapshot of metrics at this point in time
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
    impressions: number;
    bookmarks: number;
    views: number;
    
    // Calculated metrics
    totalEngagement: number; // likes + retweets + replies + quotes
    engagementRate: number; // totalEngagement / impressions * 100
  };
  
  // Growth since previous record
  growth: {
    likesDelta: number;
    retweetsDelta: number;
    repliesDelta: number;
    quotesDelta: number;
    impressionsDelta: number;
    engagementDelta: number;
    
    // Growth percentages
    likesGrowthPercent: number;
    retweetsGrowthPercent: number;
    impressionsGrowthPercent: number;
    
    // Time since last update
    hoursSinceLastUpdate?: number;
  };
  
  // Metadata
  source: 'manual' | 'reminder' | 'admin' | 'auto' | 'api';
  notes?: string;
  submittedBy: mongoose.Types.ObjectId;
  
  // Timestamp (important for time-series)
  recordedAt: Date; // When creator says metrics are from
  createdAt: Date;  // When record was created in DB
}

const MetricsSchema = new Schema<IMetrics>(
  {
    postId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Post',
      required: true,
      index: true
    },
    creatorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true
    },
    projectId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Project',
      required: true,
      index: true
    },
    organizationId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Organization',
      required: true,
      index: true
    },
    
    metrics: {
      likes: { type: Number, required: true, min: 0 },
      retweets: { type: Number, required: true, min: 0 },
      replies: { type: Number, required: true, min: 0 },
      quotes: { type: Number, default: 0, min: 0 },
      impressions: { type: Number, required: true, min: 0 },
      bookmarks: { type: Number, default: 0, min: 0 },
      views: { type: Number, default: 0, min: 0 },
      
      totalEngagement: { type: Number, default: 0, min: 0 },
      engagementRate: { type: Number, default: 0, min: 0 }
    },
    
    growth: {
      likesDelta: { type: Number, default: 0 },
      retweetsDelta: { type: Number, default: 0 },
      repliesDelta: { type: Number, default: 0 },
      quotesDelta: { type: Number, default: 0 },
      impressionsDelta: { type: Number, default: 0 },
      engagementDelta: { type: Number, default: 0 },
      
      likesGrowthPercent: { type: Number, default: 0 },
      retweetsGrowthPercent: { type: Number, default: 0 },
      impressionsGrowthPercent: { type: Number, default: 0 },
      
      hoursSinceLastUpdate: { type: Number }
    },
    
    source: { 
      type: String,
      enum: ['manual', 'reminder', 'admin', 'auto', 'api'],
      required: true,
      default: 'manual'
    },
    notes: { type: String, maxlength: 500 },
    submittedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    
    recordedAt: { 
      type: Date, 
      required: true,
      index: true
    }
  },
  { 
    timestamps: { 
      createdAt: true, 
      updatedAt: false // Time-series data shouldn't be updated
    },
    collection: 'metrics'
  }
);

// Compound indexes optimized for time-series queries
MetricsSchema.index({ postId: 1, recordedAt: -1 }); // Get metrics history for a post
MetricsSchema.index({ creatorId: 1, recordedAt: -1 }); // Get creator's metrics over time
MetricsSchema.index({ projectId: 1, recordedAt: -1 }); // Get project metrics over time
MetricsSchema.index({ organizationId: 1, recordedAt: -1 }); // Org-wide analytics
MetricsSchema.index({ recordedAt: -1 }); // For time-based queries
MetricsSchema.index({ createdAt: -1 }); // For recent updates

// Pre-save hook to calculate totals
MetricsSchema.pre('save', function(next) {
  // Calculate total engagement
  this.metrics.totalEngagement = 
    this.metrics.likes + 
    this.metrics.retweets + 
    this.metrics.replies + 
    this.metrics.quotes;
  
  // Calculate engagement rate
  if (this.metrics.impressions > 0) {
    this.metrics.engagementRate = 
      (this.metrics.totalEngagement / this.metrics.impressions) * 100;
  }
  
  next();
});

export default mongoose.models.Metrics || mongoose.model<IMetrics>('Metrics', MetricsSchema);