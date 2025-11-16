// src/types/user.ts

import { ObjectId, UserRole, CreatorStatus } from './index';

export interface CreatorStats {
  totalPosts: number;
  approvedPosts: number;
  pendingPosts: number;
  totalLikes: number;
  totalRetweets: number;
  totalImpressions: number;
  avgEngagementRate: number;
  lastPostDate?: Date;
  lastMetricUpdate?: Date;
}

export interface CreatorProfile {
  twitterHandle: string;
  twitterUserId?: string;
  twitterDisplayName?: string;
  twitterAvatar?: string;
  bio?: string;
  projectId: ObjectId;
  status: CreatorStatus;
  invitedBy: ObjectId;
  invitedAt: Date;
  activatedAt?: Date;
  stats: CreatorStats;
}

export interface UserPreferences {
  emailNotifications: boolean;
  reminderFrequency: number; // hours
  language: string;
}

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  
  // For Admins
  organizationId?: ObjectId;
  
  // For Creators
  creatorProfile?: CreatorProfile;
  
  // Auth fields
  emailVerified: boolean;
  lastLoginAt?: Date;
  loginCount: number;
  
  preferences: UserPreferences;
  
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreateUserDto {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  organizationId?: ObjectId;
}

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface CreateCreatorDto {
  email: string;
  name: string;
  twitterHandle: string;
  projectId: ObjectId;
  organizationId: ObjectId;
  invitedBy: ObjectId;
}

export interface UpdateCreatorProfileDto {
  twitterHandle?: string;
  twitterDisplayName?: string;
  twitterAvatar?: string;
  bio?: string;
}

export interface UserWithOrganization extends User {
  organization?: {
    _id: ObjectId;
    name: string;
    slug: string;
  };
}

export interface CreatorWithProject extends User {
  project?: {
    _id: ObjectId;
    name: string;
  };
}