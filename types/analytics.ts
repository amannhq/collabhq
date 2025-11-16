// src/types/analytics.ts

import { ObjectId, Trend, DateRange } from './index';
import { MetricsData, MetricsGrowth } from './metrics';

// ═══════════════════════════════════════════════════════════
// TIME-SERIES DATA
// ═══════════════════════════════════════════════════════════

export interface MetricsDataPoint {
  timestamp: Date;
  date: string; // "2025-01-15"
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions: number;
  bookmarks: number;
  views: number;
  totalEngagement: number;
  engagementRate: number;
  likesDelta?: number;
  retweetsDelta?: number;
  impressionsDelta?: number;
  engagementRateDelta?: number;
}

export interface TrendDataPoint {
  period: string; // "2025-01-15" or "2025-W03" or "2025-01"
  value: number;
  change: number; // Percentage change from previous
  trend: Trend;
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS OVERVIEW
// ═══════════════════════════════════════════════════════════

export interface AnalyticsOverview {
  totalPosts: number;
  totalCreators?: number;
  totalEngagement: number;
  totalImpressions: number;
  avgEngagementRate: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  
  // Period changes
  postsChange?: number;
  engagementChange?: number;
  impressionsChange?: number;
  
  // Trends
  trend?: Trend;
}

// ═══════════════════════════════════════════════════════════
// PERFORMANCE METRICS
// ═══════════════════════════════════════════════════════════

export interface PostPerformance {
  post: {
    _id: ObjectId;
    postUrl: string;
    content?: string;
    postedAt?: Date;
  };
  metrics: MetricsData;
  growth: MetricsGrowth;
  rank?: number;
  percentile?: number;
  isTopPerformer: boolean;
}

export interface CreatorPerformance {
  creator: {
    _id: ObjectId;
    name: string;
    email: string;
    twitterHandle: string;
    avatar?: string;
  };
  stats: {
    totalPosts: number;
    approvedPosts: number;
    totalLikes: number;
    totalRetweets: number;
    totalImpressions: number;
    avgEngagementRate: number;
  };
  avgMetrics: MetricsData;
  totalEngagement: number;
  rank?: number;
  percentile?: number;
  trend: Trend;
}

export interface ProjectPerformance {
  project: {
    _id: ObjectId;
    name: string;
    description?: string;
  };
  stats: {
    totalCreators: number;
    activeCreators: number;
    totalPosts: number;
    approvedPosts: number;
  };
  totalEngagement: number;
  avgEngagementRate: number;
  activeCreators: number;
  rank?: number;
}

// ═══════════════════════════════════════════════════════════
// COMPARISONS
// ═══════════════════════════════════════════════════════════

export interface PeriodChange {
  postsChange: number;
  postsChangePercent: number;
  engagementChange: number;
  engagementChangePercent: number;
  impressionsChange: number;
  impressionsChangePercent: number;
  trend: Trend;
}

export interface PeriodComparison {
  current: AnalyticsOverview;
  previous: AnalyticsOverview;
  change: PeriodChange;
}

export interface PeerComparison {
  creator: {
    _id: ObjectId;
    name: string;
    twitterHandle: string;
  };
  avgEngagementRate: number;
  totalEngagement: number;
  percentileDifference: number;
}

// ═══════════════════════════════════════════════════════════
// BREAKDOWN & GROUPING
// ═══════════════════════════════════════════════════════════

export interface ContentTypeStats {
  type: 'image' | 'video' | 'text' | 'link';
  count: number;
  totalEngagement: number;
  avgEngagementRate: number;
}

export interface PostingPatterns {
  byHourOfDay: Array<{
    hour: number;
    postCount: number;
    avgEngagement: number;
  }>;
  byDayOfWeek: Array<{
    day: string;
    postCount: number;
    avgEngagement: number;
  }>;
  bestTimeToPost: {
    hour: number;
    day: string;
    avgEngagement: number;
  };
}

export interface GrowthRate {
  daily: number;
  weekly: number;
  monthly: number;
  overall: number;
}

export interface PerformanceBenchmarks {
  vsProjectAvg: {
    engagementRate: number;
    likes: number;
    retweets: number;
  };
  vsOrganizationAvg: {
    engagementRate: number;
    likes: number;
    retweets: number;
  };
  percentile: number;
}

export interface MetricProjections {
  likes: {
    projected7Days: number;
    projected30Days: number;
    confidence: number;
  };
  impressions: {
    projected7Days: number;
    projected30Days: number;
    confidence: number;
  };
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS RESPONSES
// ═══════════════════════════════════════════════════════════

export interface OrganizationAnalytics {
  overview: AnalyticsOverview;
  metricsOverTime: MetricsDataPoint[];
  engagementTrend: TrendDataPoint[];
  byProject: ProjectPerformance[];
  byCreator: CreatorPerformance[];
  topPosts: PostPerformance[];
  topCreators: CreatorPerformance[];
  periodComparison: PeriodComparison;
}

export interface ProjectAnalytics {
  overview: AnalyticsOverview;
  metricsOverTime: MetricsDataPoint[];
  engagementTrend: TrendDataPoint[];
  byCreator: CreatorPerformance[];
  postPerformance: PostPerformance[];
  periodComparison: PeriodComparison;
}

export interface CreatorAnalytics {
  overview: AnalyticsOverview;
  metricsOverTime: MetricsDataPoint[];
  engagementTrend: TrendDataPoint[];
  postPerformance: PostPerformance[];
  contentTypeBreakdown: ContentTypeStats[];
  postingPatterns: PostingPatterns;
  periodComparison: PeriodComparison;
  peerComparison: PeerComparison[];
}

export interface PostAnalytics {
  overview: AnalyticsOverview;
  metricsOverTime: MetricsDataPoint[];
  growthRate: GrowthRate;
  benchmarks: PerformanceBenchmarks;
  projections?: MetricProjections;
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS QUERY PARAMS
// ═══════════════════════════════════════════════════════════

export enum Granularity {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
}

export enum MetricType {
  LIKES = 'LIKES',
  RETWEETS = 'RETWEETS',
  REPLIES = 'REPLIES',
  QUOTES = 'QUOTES',
  IMPRESSIONS = 'IMPRESSIONS',
  BOOKMARKS = 'BOOKMARKS',
  VIEWS = 'VIEWS',
  TOTAL_ENGAGEMENT = 'TOTAL_ENGAGEMENT',
  ENGAGEMENT_RATE = 'ENGAGEMENT_RATE',
}

export enum GroupBy {
  CREATOR = 'CREATOR',
  PROJECT = 'PROJECT',
  POST = 'POST',
  DATE = 'DATE',
  HOUR_OF_DAY = 'HOUR_OF_DAY',
  DAY_OF_WEEK = 'DAY_OF_WEEK',
}

export interface AnalyticsFilters {
  creatorIds?: ObjectId[];
  projectIds?: ObjectId[];
  postStatus?: string[];
  minEngagementRate?: number;
  hasMedia?: boolean;
}

export interface AnalyticsInput {
  dateRange: DateRange;
  granularity?: Granularity;
  metrics?: MetricType[];
  groupBy?: GroupBy;
  filters?: AnalyticsFilters;
}

export interface TimeSeriesInput {
  dateRange: DateRange;
  interval: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  metrics: MetricType[];
  fill?: 'ZERO' | 'NULL' | 'INTERPOLATE' | 'PREVIOUS';
}