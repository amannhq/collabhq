// src/types/project.ts

import { ObjectId, ProjectStatus } from './index';

export interface ProjectSettings {
  requirePostApproval: boolean;
  firstPostRequiresApproval: boolean;
  metricUpdateFrequency: number; // hours
  autoReminders: boolean;
  reminderTime: string; // "09:00" format
}

export interface ProjectStats {
  totalCreators: number;
  activeCreators: number;
  totalPosts: number;
  approvedPosts: number;
  pendingPosts: number;
  totalEngagement: number;
  totalImpressions: number;
  avgEngagementRate: number;
  lastUpdated: Date;
}

export interface Project {
  _id: ObjectId;
  organizationId: ObjectId;
  name: string;
  description?: string;
  status: ProjectStatus;
  settings: ProjectSettings;
  stats: ProjectStats;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreateProjectDto {
  organizationId: ObjectId;
  name: string;
  description?: string;
  settings?: Partial<ProjectSettings>;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  settings?: Partial<ProjectSettings>;
}

export interface ProjectWithCreators extends Project {
  creators: Array<{
    _id: ObjectId;
    name: string;
    email: string;
    twitterHandle: string;
    status: string;
  }>;
}

export interface ProjectWithOrganization extends Project {
  organization: {
    _id: ObjectId;
    name: string;
    slug: string;
  };
}