// src/types/invitation.ts

import { ObjectId, InvitationStatus } from './index';

export interface InvitationCreatorData {
  name: string;
  twitterHandle: string;
  role: string;
  customMessage?: string;
}

export interface EmailDelivery {
  sent: boolean;
  sentAt?: Date;
  deliveryStatus?: 'delivered' | 'bounced' | 'failed';
  opens: number;
  lastOpenedAt?: Date;
  clicks: number;
  lastClickedAt?: Date;
  emailProvider?: string;
  messageId?: string;
  errorMessage?: string;
}

export interface InvitationAccessLog {
  accessedAt: Date;
  ipAddress: string;
  userAgent: string;
  action: 'viewed' | 'clicked' | 'accepted';
}

export interface InvitationMetadata {
  inviteType: 'email' | 'link' | 'bulk';
  source: 'dashboard' | 'api' | 'csv_import';
  reminderCount: number;
  lastReminderSent?: Date;
}

export interface Invitation {
  _id: ObjectId;
  email: string;
  token: string;
  organizationId: ObjectId;
  projectId: ObjectId;
  invitedBy: ObjectId;
  creatorData: InvitationCreatorData;
  status: InvitationStatus;
  sentAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  emailDelivery: EmailDelivery;
  accessLog: InvitationAccessLog[];
  metadata: InvitationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreateInvitationDto {
  email: string;
  organizationId: ObjectId;
  projectId: ObjectId;
  name: string;
  twitterHandle: string;
  customMessage?: string;
}

export interface BulkInviteDto {
  projectId: ObjectId;
  creators: Array<{
    email: string;
    name: string;
    twitterHandle: string;
  }>;
}

export interface AcceptInvitationDto {
  token: string;
  acceptedFromIp: string;
  acceptedFromUserAgent: string;
}

export interface InvitationWithRelations extends Invitation {
  organization: {
    _id: ObjectId;
    name: string;
  };
  project: {
    _id: ObjectId;
    name: string;
  };
  inviter: {
    _id: ObjectId;
    name: string;
    email: string;
  };
}