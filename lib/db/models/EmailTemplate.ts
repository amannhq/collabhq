// lib/db/models/EmailTemplate.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  
  // Template identification
  name: string;
  slug: string; // e.g., 'invitation', 'welcome', 'reminder'
  category: 'transactional' | 'marketing' | 'notification';
  
  // Email content
  subject: string;
  previewText?: string;
  
  // Template customization
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    fontFamily: string;
  };
  
  // Content sections (editable by admin)
  content: {
    heading?: string;
    body: string; // HTML content with template variables
    ctaText?: string;
    ctaUrl?: string;
    footerText?: string;
  };
  
  // Available variables for this template
  variables: Array<{
    key: string;
    label: string;
    description: string;
    required: boolean;
    example: string;
  }>;
  
  // Status
  isActive: boolean;
  isDefault: boolean; // Whether this is the default template
  
  // Metadata
  lastUsedAt?: Date;
  usageCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    
    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    
    category: {
      type: String,
      enum: ['transactional', 'marketing', 'notification'],
      default: 'transactional',
    },
    
    subject: {
      type: String,
      required: true,
    },
    
    previewText: {
      type: String,
    },
    
    branding: {
      primaryColor: {
        type: String,
        default: '#667eea',
      },
      secondaryColor: {
        type: String,
        default: '#764ba2',
      },
      logoUrl: {
        type: String,
      },
      fontFamily: {
        type: String,
        default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      },
    },
    
    content: {
      heading: {
        type: String,
      },
      body: {
        type: String,
        required: true,
      },
      ctaText: {
        type: String,
      },
      ctaUrl: {
        type: String,
      },
      footerText: {
        type: String,
      },
    },
    
    variables: [
      {
        key: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        required: {
          type: Boolean,
          default: false,
        },
        example: {
          type: String,
          required: true,
        },
      },
    ],
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    isDefault: {
      type: Boolean,
      default: false,
    },
    
    lastUsedAt: {
      type: Date,
    },
    
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'email_templates',
  }
);

// Indexes
EmailTemplateSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
EmailTemplateSchema.index({ organizationId: 1, isActive: 1 });
EmailTemplateSchema.index({ slug: 1 });

export default mongoose.models.EmailTemplate ||
  mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);
