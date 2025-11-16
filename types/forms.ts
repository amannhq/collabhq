// src/types/forms.ts

import { ObjectId } from './index';

// ═══════════════════════════════════════════════════════════
// ORGANIZATION FORMS
// ═══════════════════════════════════════════════════════════

export interface SignupFormData {
  organizationName: string;
  adminName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface OrganizationSettingsFormData {
  logo?: File;
  primaryColor: string;
  secondaryColor: string;
  notificationEmail: string;
  timezone: string;
  dateFormat: string;
}

// ═══════════════════════════════════════════════════════════
// PROJECT FORMS
// ═══════════════════════════════════════════════════════════

export interface CreateProjectFormData {
  name: string;
  description?: string;
  requirePostApproval: boolean;
  firstPostRequiresApproval: boolean;
  metricUpdateFrequency: number;
  autoReminders: boolean;
  reminderTime: string;
}

export interface UpdateProjectFormData extends Partial<CreateProjectFormData> {
  status?: string;
}

// ═══════════════════════════════════════════════════════════
// CREATOR FORMS
// ═══════════════════════════════════════════════════════════

export interface InviteCreatorFormData {
  name: string;
  email: string;
  twitterHandle: string;
  projectId: ObjectId;
  customMessage?: string;
}

export interface BulkInviteFormData {
  projectId: ObjectId;
  csvFile?: File;
  creators: Array<{
    name: string;
    email: string;
    twitterHandle: string;
  }>;
}

export interface UpdateCreatorProfileFormData {
  name?: string;
  twitterHandle?: string;
  twitterDisplayName?: string;
  bio?: string;
  avatar?: File;
}

// ═══════════════════════════════════════════════════════════
// POST FORMS
// ═══════════════════════════════════════════════════════════

export interface SubmitPostFormData {
  postUrl: string;
  content?: string;
  postedAt?: Date;
  likes: number;
  retweets: number;
  replies: number;
  quotes?: number;
  impressions: number;
  bookmarks?: number;
  views?: number;
  notes?: string;
}

export interface UpdateMetricsFormData {
  likes: number;
  retweets: number;
  replies: number;
  quotes?: number;
  impressions: number;
  bookmarks?: number;
  views?: number;
  notes?: string;
  recordedAt?: Date;
}

export interface ApprovePostFormData {
  adminNotes?: string;
}

export interface RejectPostFormData {
  rejectionReason: string;
  adminNotes?: string;
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATION FORMS
// ═══════════════════════════════════════════════════════════

export interface SendNotificationFormData {
  recipientIds: ObjectId[];
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  shouldSendEmail: boolean;
}

// ═══════════════════════════════════════════════════════════
// FILTER FORMS
// ═══════════════════════════════════════════════════════════

export interface PostFilterFormData {
  status?: string[];
  creatorIds?: ObjectId[];
  projectIds?: ObjectId[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  minEngagementRate?: number;
  hasMedia?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AnalyticsFilterFormData {
  dateRange: {
    start: Date;
    end: Date;
  };
  granularity: string;
  metrics: string[];
  creatorIds?: ObjectId[];
  projectIds?: ObjectId[];
}