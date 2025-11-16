// src/types/post.ts

import { ObjectId, PostStatus } from './index';

export interface MetricSnapshot {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions: number;
  bookmarks: number;
  views: number;
  totalEngagement: number;
  engagementRate: number;
  lastUpdatedAt: Date;
  updatedBy: ObjectId;
}

export interface MetricGrowth {
  likesDelta: number;
  retweetsDelta: number;
  repliesDelta: number;
  impressionsDelta: number;
  engagementRateDelta: number;
}

export interface PostReminders {
  lastSent?: Date;
  nextDue?: Date;
  sentCount: number;
  reminderFrequency: number;
}

export interface PostMetadata {
  hasMedia: boolean;
  mediaType?: 'image' | 'video' | 'gif';
  mediaCount?: number;
  hasLinks: boolean;
  linkCount?: number;
  hashtagCount?: number;
  mentionCount?: number;
}

export interface Post {
  _id: ObjectId;
  projectId: ObjectId;
  creatorId: ObjectId;
  organizationId: ObjectId;
  
  postUrl: string;
  tweetId: string;
  content?: string;
  postedAt?: Date;
  
  status: PostStatus;
  isFirstPost: boolean;
  
  verifiedBy?: ObjectId;
  verifiedAt?: Date;
  adminNotes?: string;
  rejectionReason?: string;
  
  latestMetrics: MetricSnapshot;
  growth: MetricGrowth;
  reminders: PostReminders;
  metadata: PostMetadata;
  
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreatePostDto {
  projectId: ObjectId;
  creatorId: ObjectId;
  postUrl: string;
  content?: string;
  postedAt?: Date;
  initialMetrics: {
    likes: number;
    retweets: number;
    replies: number;
    quotes?: number;
    impressions: number;
    bookmarks?: number;
    views?: number;
  };
  metadata?: Partial<PostMetadata>;
}

export interface UpdatePostDto {
  content?: string;
  metadata?: Partial<PostMetadata>;
}

export interface ApprovePostDto {
  postId: ObjectId;
  adminNotes?: string;
}

export interface RejectPostDto {
  postId: ObjectId;
  rejectionReason: string;
  adminNotes?: string;
}

export interface PostWithRelations extends Post {
  creator: {
    _id: ObjectId;
    name: string;
    email: string;
    twitterHandle: string;
    avatar?: string;
  };
  project: {
    _id: ObjectId;
    name: string;
  };
  verifier?: {
    _id: ObjectId;
    name: string;
    email: string;
  };
}

export interface PostListItem {
  _id: ObjectId;
  postUrl: string;
  tweetId: string;
  content?: string;
  status: PostStatus;
  creatorName: string;
  creatorTwitterHandle: string;
  projectName: string;
  latestMetrics: MetricSnapshot;
  growth: MetricGrowth;
  createdAt: Date;
}