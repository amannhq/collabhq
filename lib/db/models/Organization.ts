// src/lib/db/models/Organization.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    startDate: Date;
    expiresAt?: Date;
    stripePriceId?: string;
    stripeCustomerId?: string;
  };
  
  settings: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    notificationEmail: string;
    timezone: string;
    dateFormat: string;
    emailSignature?: string;
    emailFromName?: string;
    notifications?: {
      emailOnNewPost?: boolean;
      emailOnPostApproved?: boolean;
      emailOnPostRejected?: boolean;
      emailOnCreatorJoined?: boolean;
      emailOnWeeklyReport?: boolean;
      emailOnMonthlyReport?: boolean;
    };
  };
  
  limits: {
    maxProjects: number;
    maxCreators: number;
    maxPostsPerMonth: number;
  };
  
  usage: {
    projectsCount: number;
    creatorsCount: number;
    postsThisMonth: number;
    lastResetDate: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Virtual for owner
interface IOrganizationMethods {
  updateUsage(): Promise<void>;
  checkLimits(): Promise<boolean>;
}

type OrganizationModel = Model<IOrganization, Record<string, never>, IOrganizationMethods>;

const OrganizationSchema = new Schema<IOrganization, OrganizationModel, IOrganizationMethods>(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    slug: { 
      type: String, 
      required: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/
    },
    ownerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true
    },
    
    subscription: {
      plan: { 
        type: String, 
        enum: ['free', 'pro', 'enterprise'],
        default: 'free'
      },
      status: { 
        type: String, 
        enum: ['active', 'cancelled', 'expired', 'trial'],
        default: 'trial'
      },
      startDate: { type: Date, default: Date.now },
      expiresAt: { type: Date },
      stripePriceId: { type: String },
      stripeCustomerId: { type: String }
    },
    
    settings: {
      logo: { type: String },
      primaryColor: { type: String, default: '#3b82f6' },
      secondaryColor: { type: String, default: '#10b981' },
      notificationEmail: { type: String },
      timezone: { type: String, default: 'UTC' },
      dateFormat: { type: String, default: 'MM/DD/YYYY' },
      emailSignature: { type: String },
      emailFromName: { type: String },
      notifications: {
        emailOnNewPost: { type: Boolean, default: true },
        emailOnPostApproved: { type: Boolean, default: true },
        emailOnPostRejected: { type: Boolean, default: true },
        emailOnCreatorJoined: { type: Boolean, default: true },
        emailOnWeeklyReport: { type: Boolean, default: true },
        emailOnMonthlyReport: { type: Boolean, default: false }
      }
    },
    
    limits: {
      maxProjects: { type: Number, default: 3 },
      maxCreators: { type: Number, default: 10 },
      maxPostsPerMonth: { type: Number, default: 100 }
    },
    
    usage: {
      projectsCount: { type: Number, default: 0 },
      creatorsCount: { type: Number, default: 0 },
      postsThisMonth: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now }
    }
  },
  { 
    timestamps: true,
    collection: 'organizations'
  }
);

// Indexes
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ ownerId: 1 });
OrganizationSchema.index({ 'subscription.status': 1 });

// Methods
OrganizationSchema.methods.updateUsage = async function() {
  const Project = mongoose.model('Project');
  const User = mongoose.model('User');
  const Post = mongoose.model('Post');
  
  const projectsCount = await Project.countDocuments({ organizationId: this._id });
  const creatorsCount = await User.countDocuments({ 
    'creatorProfile.projectId': { $exists: true },
    organizationId: this._id 
  });
  
  // Posts this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const postsThisMonth = await Post.countDocuments({
    projectId: { $in: await Project.find({ organizationId: this._id }).select('_id') },
    createdAt: { $gte: startOfMonth }
  });
  
  this.usage = {
    projectsCount,
    creatorsCount,
    postsThisMonth,
    lastResetDate: startOfMonth
  };
  
  await this.save();
};

export default mongoose.models.Organization || 
  mongoose.model<IOrganization, OrganizationModel>('Organization', OrganizationSchema);