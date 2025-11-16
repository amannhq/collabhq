// src/types/metrics.ts

import { ObjectId, MetricSource } from './index';

export interface MetricsData {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions: number;
  bookmarks: number;
  views: number;
  totalEngagement: number;
  engagementRate: number;
}

export interface MetricsGrowth {
  likesDelta: number;
  retweetsDelta: number;
  repliesDelta: number;
  quotesDelta: number;
  impressionsDelta: number;
  engagementDelta: number;
  likesGrowthPercent: number;
  retweetsGrowthPercent: number;
  impressionsGrowthPercent: number;
  hoursSinceLastUpdate?: number;
}

export interface Metrics {
  _id: ObjectId;
  postId: ObjectId;
  creatorId: ObjectId;
  projectId: ObjectId;
  organizationId: ObjectId;
  
  metrics: MetricsData;
  growth: MetricsGrowth;
  
  source: MetricSource;
  notes?: string;
  submittedBy: ObjectId;
  
  recordedAt: Date;
  createdAt: Date;
}

// DTOs
export interface SubmitMetricsDto {
  postId: ObjectId;
  likes: number;
  retweets: number;
  replies: number;
  quotes?: number;
  impressions: number;
  bookmarks?: number;
  views?: number;
  notes?: string;
  recordedAt?: Date;
  source?: MetricSource;
}

export interface BulkSubmitMetricsDto {
  metrics: Array<{
    postId: ObjectId;
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
    recordedAt?: Date;
  }>;
}

export interface MetricsHistory {
  postId: ObjectId;
  dataPoints: Metrics[];
  summary: {
    totalUpdates: number;
    firstUpdate: Date;
    lastUpdate: Date;
    totalGrowth: MetricsGrowth;
  };
}

export interface MetricsComparison {
  current: MetricsData;
  previous: MetricsData;
  change: MetricsGrowth;
  percentChange: {
    likes: number;
    retweets: number;
    impressions: number;
    engagement: number;
  };
}