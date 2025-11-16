 // src/types/organization.ts

import { ObjectId, SubscriptionPlan, SubscriptionStatus } from './index';

export interface OrganizationSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  expiresAt?: Date;
  stripePriceId?: string;
  stripeCustomerId?: string;
}

export interface OrganizationSettings {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  notificationEmail: string;
  timezone: string;
  dateFormat: string;
}

export interface OrganizationLimits {
  maxProjects: number;
  maxCreators: number;
  maxPostsPerMonth: number;
}

export interface OrganizationUsage {
  projectsCount: number;
  creatorsCount: number;
  postsThisMonth: number;
  lastResetDate: Date;
}

export interface Organization {
  _id: ObjectId;
  name: string;
  slug: string;
  ownerId: ObjectId;
  subscription: OrganizationSubscription;
  settings: OrganizationSettings;
  limits: OrganizationLimits;
  usage: OrganizationUsage;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs (Data Transfer Objects)
export interface CreateOrganizationDto {
  name: string;
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  settings?: Partial<OrganizationSettings>;
}

export interface OrganizationWithOwner extends Organization {
  owner: {
    _id: ObjectId;
    name: string;
    email: string;
    avatar?: string;
  };
}