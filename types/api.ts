// src/types/api.ts

import { PaginationParams, PaginatedResponse, ApiResponse } from './index';
import * as Types from './';

// ═══════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════

export interface ListPostsRequest extends PaginationParams {
  organizationId?: string;
  projectId?: string;
  creatorId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListCreatorsRequest extends PaginationParams {
  organizationId?: string;
  projectId?: string;
  status?: string;
  search?: string;
}

export interface GetAnalyticsRequest {
  startDate: string;
  endDate: string;
  granularity?: string;
  metrics?: string[];
}

// ═══════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════

export type OrganizationResponse = ApiResponse<Types.Organization>;
export type UserResponse = ApiResponse<Types.User>;
export type ProjectResponse = ApiResponse<Types.Project>;
export type PostResponse = ApiResponse<Types.Post>;
export type MetricsResponse = ApiResponse<Types.Metrics>;
export type InvitationResponse = ApiResponse<Types.Invitation>;
export type NotificationResponse = ApiResponse<Types.Notification>;

export type OrganizationListResponse = ApiResponse<PaginatedResponse<Types.Organization>>;
export type ProjectListResponse = ApiResponse<PaginatedResponse<Types.Project>>;
export type PostListResponse = ApiResponse<PaginatedResponse<Types.Post>>;
export type CreatorListResponse = ApiResponse<PaginatedResponse<Types.User>>;
export type NotificationListResponse = ApiResponse<PaginatedResponse<Types.Notification>>;

export type AnalyticsResponse = ApiResponse<Types.OrganizationAnalytics | Types.ProjectAnalytics | Types.CreatorAnalytics>;