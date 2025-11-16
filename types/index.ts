// src/types/index.ts

import { Types } from 'mongoose';

// ═══════════════════════════════════════════════════════════
// BASE TYPES
// ═══════════════════════════════════════════════════════════

export type ObjectId = Types.ObjectId | string;

export type DateString = string; // ISO 8601 format
export type Timestamp = Date | string | number;

// ═══════════════════════════════════════════════════════════
// COMMON ENUMS
// ═══════════════════════════════════════════════════════════

export enum UserRole {
  ADMIN = 'admin',
  CREATOR = 'creator',
}

export enum PostStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum CreatorStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  BOUNCED = 'bounced',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

export enum NotificationType {
  POST_SUBMITTED = 'post_submitted',
  POST_APPROVED = 'post_approved',
  POST_REJECTED = 'post_rejected',
  METRICS_REMINDER = 'metrics_reminder',
  METRICS_UPDATED = 'metrics_updated',
  MILESTONE_REACHED = 'milestone_reached',
  ADMIN_MESSAGE = 'admin_message',
  CREATOR_INVITED = 'creator_invited',
  CREATOR_JOINED = 'creator_joined',
  PROJECT_CREATED = 'project_created',
  WEEKLY_REPORT = 'weekly_report',
  SYSTEM_ALERT = 'system_alert',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ActivityAction {
  // User actions
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_INVITED = 'user_invited',
  USER_ACCEPTED_INVITATION = 'user_accepted_invitation',
  
  // Organization actions
  ORGANIZATION_CREATED = 'organization_created',
  ORGANIZATION_UPDATED = 'organization_updated',
  ORGANIZATION_SETTINGS_CHANGED = 'organization_settings_changed',
  
  // Project actions
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',
  PROJECT_ARCHIVED = 'project_archived',
  
  // Post actions
  POST_CREATED = 'post_created',
  POST_SUBMITTED = 'post_submitted',
  POST_APPROVED = 'post_approved',
  POST_REJECTED = 'post_rejected',
  POST_DELETED = 'post_deleted',
  
  // Metrics actions
  METRICS_SUBMITTED = 'metrics_submitted',
  METRICS_UPDATED = 'metrics_updated',
  METRICS_BULK_IMPORT = 'metrics_bulk_import',
  
  // Creator actions
  CREATOR_INVITED = 'creator_invited',
  CREATOR_ACTIVATED = 'creator_activated',
  CREATOR_SUSPENDED = 'creator_suspended',
  CREATOR_REMOVED = 'creator_removed',
  
  // Notification actions
  NOTIFICATION_SENT = 'notification_sent',
  NOTIFICATION_READ = 'notification_read',
  BULK_NOTIFICATION_SENT = 'bulk_notification_sent',
  
  // Admin actions
  ADMIN_ACTION_PERFORMED = 'admin_action_performed',
  SETTINGS_CHANGED = 'settings_changed',
  EXPORT_GENERATED = 'export_generated',
}

export enum MetricSource {
  MANUAL = 'manual',
  REMINDER = 'reminder',
  ADMIN = 'admin',
  AUTO = 'auto',
  API = 'api',
}

export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
}

export enum Trend {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
}

export enum Severity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// ═══════════════════════════════════════════════════════════
// PAGINATION
// ═══════════════════════════════════════════════════════════

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ═══════════════════════════════════════════════════════════
// SORTING & FILTERING
// ═══════════════════════════════════════════════════════════

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  field: string;
  order: SortOrder;
}

export interface DateRange {
  start: Date | string;
  end: Date | string;
  timezone?: string;
}

// ═══════════════════════════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════════════════════════

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

// ═══════════════════════════════════════════════════════════
// REQUEST CONTEXT
// ═══════════════════════════════════════════════════════════

export interface RequestMetadata {
  ipAddress: string;
  userAgent: string;
  browser?: string;
  os?: string;
  device?: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

// src/types/index.ts (main export file)

// Base types
export * from './index';

// Domain types
export * from './organization';
export * from './user';
export * from './project';
export * from './post';
export * from './metrics';
export * from './invitation';
export * from './notification';
export * from './activity';
export * from './analytics';

// Form types
export * from './forms';

// API types
export * from './api';