// src/lib/db/models/index.ts
import Organization from './Organization';
import User from './User';
import Project from './Project';
import Post from './Post';
import Metrics from './Metrics';
import Invitation from './Invitation';
import Notification from './Notification';
import ActivityLog from './ActivityLog';
import EmailTemplate from './EmailTemplate';

export {
  Organization,
  User,
  Project,
  Post,
  Metrics,
  Invitation,
  Notification,
  ActivityLog,
  EmailTemplate,
};

// Export types
export type { IOrganization } from './Organization';
export type { IUser } from './User';
export type { IProject } from './Project';
export type { IPost } from './Post';
export type { IMetrics } from './Metrics';
export type { IInvitation } from './Invitation';
export type { INotification } from './Notification';
export type { IActivityLog } from './ActivityLog';
export type { IEmailTemplate } from './EmailTemplate';